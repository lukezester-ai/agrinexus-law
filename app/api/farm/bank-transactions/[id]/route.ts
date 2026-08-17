import { handleApiError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankTransactions } from '@/lib/db/schema/banking';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    await db.update(bankTransactions).set({
      accountId: body.accountId,
      amount: body.amount != null ? String(body.amount) : undefined,
      currency: body.currency,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
      counterpartyName: body.counterpartyName,
      counterpartyIban: body.counterpartyIban,
      isReconciled: body.isReconciled,
      matchStatus: body.matchStatus,
    }).where(and(eq(bankTransactions.id, id), eq(bankTransactions.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return handleApiError(err); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();
    await db.delete(bankTransactions).where(and(eq(bankTransactions.id, id), eq(bankTransactions.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return handleApiError(err); }
}
