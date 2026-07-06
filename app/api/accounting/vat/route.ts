import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { vatJournals } from '@/lib/db/schema/vat_journals';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'sales';
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const { db } = getDb();
    const conditions: any[] = [eq(vatJournals.tenantId, tenantId), eq(vatJournals.type, type)];
    if (year) conditions.push(sql`${vatJournals.periodYear} = ${year}`);
    if (month) conditions.push(sql`${vatJournals.periodMonth} = ${month}`);

    const result = await db
      .select()
      .from(vatJournals)
      .where(and(...conditions))
      .orderBy(desc(vatJournals.entryDate))
      .limit(500);
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

    const [result] = await db
      .insert(vatJournals)
      .values({
        tenantId,
        type: body.type || 'sales',
        periodYear: String(body.periodYear || new Date().getFullYear()),
        periodMonth: String(body.periodMonth || new Date().getMonth() + 1),
        entryDate: new Date(body.entryDate),
        documentNumber: body.documentNumber || null,
        counterpartyName: body.counterpartyName || null,
        counterpartyVat: body.counterpartyVat || null,
        invoiceNumber: body.invoiceNumber || null,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        netAmount: String(body.netAmount || 0),
        vatAmount: String(body.vatAmount || 0),
        totalAmount: String(body.totalAmount || 0),
        vatRate: String(body.vatRate || 20),
        isIntraCommunity: body.isIntraCommunity ? 'true' : 'false',
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
