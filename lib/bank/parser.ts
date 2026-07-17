import { getDb } from '@/lib/db/db';
import { invoices, purchaseInvoices } from '@/lib/db/schema/invoices';
import { counterparties } from '@/lib/db/schema/counterparties';
import { eq } from 'drizzle-orm';

export interface ParsedTransaction {
  date: Date;
  amount: number;
  currency: string;
  counterpartyName: string | null;
  counterpartyIban: string | null;
  description: string | null;
  transactionId: string | null;
  matchStatus?: 'matched' | 'partial' | 'unmatched';
  isReconciled?: boolean;
  matchedEntity?: { type: 'invoice' | 'purchase_invoice' | 'counterparty'; id: string; numberOrName: string } | null;
}

/**
 * TICKET 5 (P1): Parse Bulgarian Bank CSV exports (UniCredit, DSK, Fibank, Postbank, etc.)
 */
export function parseBankCsv(fileContent: string): ParsedTransaction[] {
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const parsed: ParsedTransaction[] = [];

  // Skip header if first row contains non-numeric text like "Дата", "Сума"
  let startIndex = 0;
  if (/дата|date|сума|amount|основание|description/i.test(lines[0])) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    if (cols.length < 3) continue;

    // Common column layouts:
    // Layout 1: [0] Date, [1] Amount, [2] Currency, [3] Counterparty Name, [4] Counterparty IBAN, [5] Description
    // Layout 2 (UniCredit/DSK standard): [0] Date, [1] Description/Reason, [2] Counterparty, [3] IBAN, [4] Debit, [5] Credit
    let dateStr = cols[0]?.trim() || '';
    let amount = 0;
    let description = '';
    let counterpartyName = '';
    let counterpartyIban = '';
    let currency = 'BGN';

    const date = parseBgDate(dateStr) || new Date();

    // Check if separate Debit/Credit columns exist
    if (cols.length >= 6 && (isNumeric(cols[4]) || isNumeric(cols[5]))) {
      const debit = parseFloat(cleanNum(cols[4])) || 0;
      const credit = parseFloat(cleanNum(cols[5])) || 0;
      amount = credit > 0 ? credit : -debit;
      description = cols[1]?.trim() || '';
      counterpartyName = cols[2]?.trim() || '';
      counterpartyIban = cols[3]?.trim() || '';
    } else {
      amount = parseFloat(cleanNum(cols[1])) || 0;
      currency = cols[2]?.trim().toUpperCase() === 'EUR' ? 'EUR' : 'BGN';
      counterpartyName = cols[3]?.trim() || '';
      counterpartyIban = cols[4]?.trim() || '';
      description = cols[5]?.trim() || cols[1]?.trim() || '';
    }

    if (isNaN(amount) || amount === 0) continue;

    parsed.push({
      date,
      amount,
      currency,
      counterpartyName: counterpartyName || null,
      counterpartyIban: counterpartyIban || null,
      description: description || null,
      transactionId: `CSV-${i}-${Date.now()}`,
    });
  }

  return parsed;
}

/**
 * TICKET 5 (P1): Parse MT940 SWIFT format statement strings
 */
export function parseBankMt940(fileContent: string): ParsedTransaction[] {
  const parsed: ParsedTransaction[] = [];
  const lines = fileContent.split(/\r?\n/);

  let currentTx: Partial<ParsedTransaction> | null = null;

  for (const line of lines) {
    if (line.startsWith(':61:')) {
      if (currentTx && currentTx.amount !== undefined) {
        parsed.push(currentTx as ParsedTransaction);
      }
      // Example :61:2607170717CD1250,00NTRFNONREF
      const body = line.substring(4);
      const dateSub = body.substring(0, 6); // YYMMDD
      const year = 2000 + parseInt(dateSub.substring(0, 2), 10);
      const month = parseInt(dateSub.substring(2, 4), 10) - 1;
      const day = parseInt(dateSub.substring(4, 6), 10);
      const date = !isNaN(year) && !isNaN(month) && !isNaN(day) ? new Date(year, month, day) : new Date();

      const isDebit = body.includes('D') && !body.includes('CD');
      const numMatch = body.match(/[A-Z]+([\d,.]+)/);
      let amount = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : 0;
      if (isDebit) amount = -amount;

      currentTx = {
        date,
        amount,
        currency: 'BGN',
        transactionId: `MT940-${parsed.length}-${Date.now()}`,
        counterpartyName: null,
        counterpartyIban: null,
        description: null,
      };
    } else if (line.startsWith(':86:') && currentTx) {
      const details = line.substring(4).trim();
      currentTx.description = details;

      // Extract IBAN / Counterparty if formatted like /IBAN/BG12.../NAME/Firma OOD
      const ibanMatch = details.match(/\/IBAN\/([A-Z0-9]+)/i) || details.match(/(BG\d{2}[A-Z]{4}\d{14})/i);
      if (ibanMatch) currentTx.counterpartyIban = ibanMatch[1];

      const nameMatch = details.match(/\/NAME\/([^/]+)/i);
      if (nameMatch) currentTx.counterpartyName = nameMatch[1].trim();
    }
  }

  if (currentTx && currentTx.amount !== undefined) {
    parsed.push(currentTx as ParsedTransaction);
  }

  return parsed;
}

/**
 * TICKET 5 (P1): Reconcile and auto-match parsed transactions against database records
 */
export async function autoMatchTransactions(tenantId: string, transactions: ParsedTransaction[]): Promise<ParsedTransaction[]> {
  if (transactions.length === 0) return [];
  const { db } = getDb();

  const sales = await db.select().from(invoices).where(eq(invoices.tenantId, tenantId));
  const purchases = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId));
  const cps = await db.select().from(counterparties).where(eq(counterparties.tenantId, tenantId));

  return transactions.map(tx => {
    let status: 'matched' | 'partial' | 'unmatched' = 'unmatched';
    let matchedEntity = null;

    const descStr = (tx.description || '').toLowerCase();
    const cpName = (tx.counterpartyName || '').toLowerCase();
    const absAmount = Math.abs(tx.amount);

    // 1. Check direct Invoice Number match inside description (e.g., "ФАКТУРА #10024" or "10024")
    for (const inv of sales) {
      const invNum = (inv.invoiceNumber || '').toLowerCase();
      const invTotal = parseFloat(String(inv.totalAmount || 0));
      if (invNum.length >= 3 && descStr.includes(invNum)) {
        status = Math.abs(invTotal - absAmount) < 0.05 ? 'matched' : 'partial';
        matchedEntity = { type: 'invoice' as const, id: inv.id, numberOrName: `Фактура №${inv.invoiceNumber} (${inv.clientName || ''})` };
        break;
      }
    }

    if (status !== 'matched') {
      for (const pinv of purchases) {
        const pinvNum = (pinv.invoiceNumber || '').toLowerCase();
        const pinvTotal = parseFloat(String(pinv.totalAmount || 0));
        if (pinvNum.length >= 3 && descStr.includes(pinvNum)) {
          status = Math.abs(pinvTotal - absAmount) < 0.05 ? 'matched' : 'partial';
          matchedEntity = { type: 'purchase_invoice' as const, id: pinv.id, numberOrName: `Покупка №${pinv.invoiceNumber} (${pinv.supplierName || ''})` };
          break;
        }
      }
    }

    // 2. If not matched by invoice number, check counterparty exact name/IBAN + amount
    if (status === 'unmatched') {
      for (const cp of cps) {
        const name = (cp.name || '').toLowerCase();
        if ((name.length >= 3 && cpName.includes(name)) || (tx.counterpartyIban && cp.eik && tx.counterpartyIban.includes(cp.eik))) {
          status = 'partial';
          matchedEntity = { type: 'counterparty' as const, id: cp.id, numberOrName: cp.name };
          break;
        }
      }
    }

    return {
      ...tx,
      matchStatus: status,
      isReconciled: status === 'matched',
      matchedEntity,
    };
  });
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function cleanNum(val: string | undefined): string {
  if (!val) return '0';
  return val.replace(/["\sлвBGNEUR]+/g, '').replace(',', '.').trim();
}

function isNumeric(val: string | undefined): boolean {
  if (!val) return false;
  const c = cleanNum(val);
  return !isNaN(parseFloat(c));
}

function parseBgDate(str: string): Date | null {
  if (!str) return null;
  // Try DD.MM.YYYY or YYYY-MM-DD
  const dotMatch = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
  if (dotMatch) {
    const day = parseInt(dotMatch[1], 10);
    const month = parseInt(dotMatch[2], 10) - 1;
    const year = parseInt(dotMatch[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
