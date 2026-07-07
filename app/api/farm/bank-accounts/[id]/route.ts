import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankAccounts } from '@/lib/db/schema/banking';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
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
    }).where(eq(bankAccounts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
