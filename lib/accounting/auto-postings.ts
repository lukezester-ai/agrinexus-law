import { getDb } from '@/lib/db/db';
import { journalHeaders, journalLines } from '@/lib/db/schema/journal_entries';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { eq, and } from 'drizzle-orm';

interface AutoPostingInput {
  tenantId: string;
  userId: string;
  documentType: string;
  documentId: string;
  entryDate: Date;
  description: string;
  lines: {
    accountNumber: string;
    entryType: 'debit' | 'credit';
    amount: number;
    description?: string;
  }[];
}

export async function createAutoPosting(input: AutoPostingInput) {
  const { db } = getDb();
  const { tenantId, userId, documentType, documentId, entryDate, description, lines } = input;

  const year = entryDate.getFullYear();
  const count = await db
    .select({ count: journalHeaders.id })
    .from(journalHeaders)
    .where(and(eq(journalHeaders.tenantId, tenantId)))
    .then((r) => r.length + 1);

  const journalNumber = `${year}-${String(count).padStart(5, '0')}`;

  const [header] = await db
    .insert(journalHeaders)
    .values({
      tenantId,
      journalNumber,
      entryDate,
      description,
      documentType,
      documentId,
      status: 'posted',
      postedBy: userId,
      postedAt: new Date(),
    })
    .returning();

  const accountNumbers = lines.map((l) => l.accountNumber);
  const accounts = await db
    .select()
    .from(accountPlan)
    .where(and(eq(accountPlan.tenantId, tenantId), ...accountNumbers.map((n) => eq(accountPlan.accountNumber, n))));

  const accountMap = new Map(accounts.map((a) => [a.accountNumber, a.id]));

  const dbLines = lines.map((line) => {
    const accountId = accountMap.get(line.accountNumber);
    if (!accountId) throw new Error(`Account ${line.accountNumber} not found for tenant`);

    return {
      journalId: header.id,
      accountId,
      entryType: line.entryType,
      amount: String(line.amount),
      description: line.description,
    };
  });

  await db.insert(journalLines).values(dbLines);

  return { journalHeaderId: header.id, journalNumber, linesCreated: dbLines.length };
}

export async function postSalesInvoiceToJournal(tenantId: string, userId: string, invoice: {
  id: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  clientName: string;
  invoiceNumber: string;
  issueDate: Date;
}) {
  const vatRate = invoice.vatAmount > 0 ? 20 : 0;

  const lines = [
    { accountNumber: '411', entryType: 'debit' as const, amount: invoice.totalAmount, description: `Вземане ${invoice.clientName}` },
    { accountNumber: '701', entryType: 'credit' as const, amount: invoice.netAmount, description: `Приход ${invoice.invoiceNumber}` },
  ];

  if (vatRate > 0) {
    lines.push({ accountNumber: '4532', entryType: 'credit' as const, amount: invoice.vatAmount, description: `ДДС ${invoice.invoiceNumber}` });
  }

  return createAutoPosting({
    tenantId,
    userId,
    documentType: 'sales_invoice',
    documentId: invoice.id,
    entryDate: invoice.issueDate,
    description: `Осчетоводяване на фактура ${invoice.invoiceNumber}`,
    lines,
  });
}

export async function postPurchaseInvoiceToJournal(tenantId: string, userId: string, invoice: {
  id: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  supplierName: string;
  invoiceNumber: string;
  issueDate: Date;
}) {
  const lines = [
    { accountNumber: '601', entryType: 'debit' as const, amount: invoice.netAmount, description: `Доставка ${invoice.supplierName}` },
    { accountNumber: '401', entryType: 'credit' as const, amount: invoice.totalAmount, description: `Задължение ${invoice.supplierName}` },
  ];

  if (invoice.vatAmount > 0) {
    lines.push({ accountNumber: '4531', entryType: 'debit' as const, amount: invoice.vatAmount, description: `ДДС ${invoice.invoiceNumber}` });
  }

  return createAutoPosting({
    tenantId,
    userId,
    documentType: 'purchase_invoice',
    documentId: invoice.id,
    entryDate: invoice.issueDate,
    description: `Осчетоводяване на покупка ${invoice.invoiceNumber}`,
    lines,
  });
}
