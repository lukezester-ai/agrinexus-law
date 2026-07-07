import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { invoices } from '@/lib/db/schema/invoices';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { updateInventoryFromInvoice } from '@/lib/farm/invoice-to-inventory';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId))
      .orderBy(desc(invoices.issueDate))
      .limit(200);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();

    const year = new Date().getFullYear();
    const count = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId))
      .then((r) => r.length + 1);
    const invoiceNumber = `S-${year}-${String(count).padStart(5, '0')}`;

    const [result] = await db
      .insert(invoices)
      .values({
        tenantId, invoiceNumber, type: 'sales',
        clientName: body.clientName || null, clientEik: body.clientEik || null,
        clientVatNumber: body.clientVatNumber || null, clientAddress: body.clientAddress || null,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status || 'draft',
        subtotal: String(body.subtotal || 0), vatRate: String(body.vatRate || 20),
        vatAmount: String(body.vatAmount || 0), totalAmount: String(body.totalAmount || 0),
        items: body.items || null, notes: body.notes || null,
      })
      .returning();

    if (result.status !== "draft" && Array.isArray(body.items) && body.items.length > 0) {
      await updateInventoryFromInvoice({
        tenantId, type: "sales", items: body.items,
        date: body.issueDate ? new Date(body.issueDate) : new Date(), invoiceNumber,
      }).catch(() => {});
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
