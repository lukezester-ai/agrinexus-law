import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankTransactions } from '@/lib/db/schema/banking';
import { resolveTenantId } from '@/lib/db/tenant-context';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { accountId, transactions } = body;

    if (!accountId || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'accountId and transactions array required' }, { status: 400 });
    }

    const { db } = getDb();
    const values = transactions.map((t: any) => ({
      tenantId,
      accountId,
      amount: String(t.amount),
      currency: t.currency || 'BGN',
      date: new Date(t.date),
      description: t.description || null,
      counterpartyName: t.counterpartyName || null,
      counterpartyIban: t.counterpartyIban || null,
    }));

    const result = await db.insert(bankTransactions).values(values).returning();
    return NextResponse.json({ imported: result.length }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
