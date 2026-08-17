import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankAccounts } from '@/lib/db/schema/banking';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    await db.update(bankAccounts).set({
      name: body.name,
      institutionName: body.institutionName,
      iban: body.iban,
      balance: body.balance != null ? String(body.balance) : undefined,
      currency: body.currency,
      isActive: body.isActive,
    }).where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();
    await db.delete(bankAccounts).where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
