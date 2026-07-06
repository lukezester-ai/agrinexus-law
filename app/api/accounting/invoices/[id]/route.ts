import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { invoices } from '@/lib/db/schema/invoices';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();

    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
      .limit(1);
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.update(invoices).set({
      clientName: body.clientName,
      clientEik: body.clientEik,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status,
      subtotal: body.subtotal !== undefined ? String(body.subtotal) : undefined,
      vatRate: body.vatRate !== undefined ? String(body.vatRate) : undefined,
      vatAmount: body.vatAmount !== undefined ? String(body.vatAmount) : undefined,
      totalAmount: body.totalAmount !== undefined ? String(body.totalAmount) : undefined,
      items: body.items || null,
      notes: body.notes,
    }).where(eq(invoices.id, id));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();

    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
      .limit(1);
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.delete(invoices).where(eq(invoices.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
