import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { purchaseInvoices } from '@/lib/db/schema/invoices';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { updateInventoryFromInvoice } from '@/lib/farm/invoice-to-inventory';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();

    const [existing] = await db
      .select()
      .from(purchaseInvoices)
      .where(and(eq(purchaseInvoices.id, id), eq(purchaseInvoices.tenantId, tenantId)))
      .limit(1);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const prevStatus = existing.status;
    const newStatus = body.status || prevStatus;

    await db.update(purchaseInvoices).set({
      supplierName: body.supplierName, supplierEik: body.supplierEik,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: newStatus,
      netAmount: body.netAmount !== undefined ? String(body.netAmount) : undefined,
      vatAmount: body.vatAmount !== undefined ? String(body.vatAmount) : undefined,
      totalAmount: body.totalAmount !== undefined ? String(body.totalAmount) : undefined,
      items: body.items || null,
    }).where(eq(purchaseInvoices.id, id));

    if (prevStatus === "draft" && (newStatus === "issued" || newStatus === "paid")) {
      const items = (body.items || existing.items || []) as any[];
      if (items.length > 0) {
        await updateInventoryFromInvoice({
          tenantId, type: "purchase", items,
          date: new Date(), invoiceNumber: existing.invoiceNumber,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();

    const existing = await db
      .select()
      .from(purchaseInvoices)
      .where(and(eq(purchaseInvoices.id, id), eq(purchaseInvoices.tenantId, tenantId)))
      .limit(1);
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.delete(purchaseInvoices).where(eq(purchaseInvoices.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
