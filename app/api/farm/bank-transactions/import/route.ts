import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankTransactions, bankAccounts } from '@/lib/db/schema/banking';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { parseBankCsv, parseBankMt940, autoMatchTransactions } from '@/lib/bank/parser';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { accountId, fileContent, format = 'csv' } = body;

    if (!accountId || !fileContent) {
      return NextResponse.json({ error: 'accountId and fileContent are required' }, { status: 400 });
    }

    const rawTransactions = format === 'mt940'
      ? parseBankMt940(fileContent)
      : parseBankCsv(fileContent);

    if (rawTransactions.length === 0) {
      return NextResponse.json({ error: 'Не са намерени валидни транзакции във файла' }, { status: 400 });
    }

    const reconciled = await autoMatchTransactions(tenantId, rawTransactions);

    const { db } = getDb();
    const inserted = [];
    let netChange = 0;

    for (const tx of reconciled) {
      const [res] = await db.insert(bankTransactions).values({
        tenantId,
        accountId,
        transactionId: tx.transactionId || null,
        amount: String(tx.amount),
        currency: tx.currency || 'BGN',
        date: tx.date,
        description: tx.description || null,
        counterpartyName: tx.counterpartyName || null,
        counterpartyIban: tx.counterpartyIban || null,
        isReconciled: tx.isReconciled ? 'true' : 'false',
        matchStatus: tx.matchStatus || 'unmatched',
      }).returning();

      inserted.push({ ...res, matchedEntity: tx.matchedEntity || null });
      netChange += tx.amount;
    }

    // Update account balance
    const [acc] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, accountId)).limit(1);
    if (acc) {
      const currentBal = parseFloat(String(acc.balance || 0));
      await db.update(bankAccounts).set({ balance: String((currentBal + netChange).toFixed(2)) }).where(eq(bankAccounts.id, accountId));
    }

    const summary = {
      total: inserted.length,
      matched: inserted.filter(i => i.matchStatus === 'matched').length,
      partial: inserted.filter(i => i.matchStatus === 'partial').length,
      unmatched: inserted.filter(i => i.matchStatus === 'unmatched').length,
    };

    return NextResponse.json({ summary, transactions: inserted }, { status: 201 });
  } catch (err: any) {
    console.error('Bank import error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
