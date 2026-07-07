import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankTransactions, bankAccounts } from '@/lib/db/schema/banking';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const { db } = getDb();

    const conditions = [eq(bankTransactions.tenantId, tenantId)];
    if (accountId) conditions.push(eq(bankTransactions.accountId, accountId));

    const rows = await db
      .select({
        id: bankTransactions.id,
        tenantId: bankTransactions.tenantId,
        accountId: bankTransactions.accountId,
        transactionId: bankTransactions.transactionId,
        amount: bankTransactions.amount,
        currency: bankTransactions.currency,
        date: bankTransactions.date,
        description: bankTransactions.description,
        counterpartyName: bankTransactions.counterpartyName,
        counterpartyIban: bankTransactions.counterpartyIban,
        isReconciled: bankTransactions.isReconciled,
        matchStatus: bankTransactions.matchStatus,
        createdAt: bankTransactions.createdAt,
        accountName: bankAccounts.name,
      })
      .from(bankTransactions)
      .leftJoin(bankAccounts, eq(bankTransactions.accountId, bankAccounts.id))
      .where(and(...conditions))
      .orderBy(desc(bankTransactions.date));
    return NextResponse.json(rows.map((r: any) => ({ ...r, amount: Number(r.amount) })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(bankTransactions).values({
      tenantId,
      accountId: body.accountId,
      amount: String(body.amount),
      currency: body.currency || 'BGN',
      date: new Date(body.date),
      description: body.description || null,
      counterpartyName: body.counterpartyName || null,
      counterpartyIban: body.counterpartyIban || null,
      transactionId: body.transactionId || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
