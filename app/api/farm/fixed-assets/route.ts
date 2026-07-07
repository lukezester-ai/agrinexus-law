import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { fixedAssets } from '@/lib/db/schema/fixed_assets';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db.select().from(fixedAssets).where(eq(fixedAssets.tenantId, tenantId)).orderBy(asc(fixedAssets.name));
    return NextResponse.json(result.map((a: any) => ({
      ...a,
      acquisitionCost: Number(a.acquisitionCost),
      salvageValue: a.salvageValue ? Number(a.salvageValue) : 0,
      usefulLifeMonths: Number(a.usefulLifeMonths),
      accumulatedAmortization: Number(a.accumulatedAmortization),
      bookValue: a.bookValue ? Number(a.bookValue) : 0,
    })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const acquisitionCost = Number(body.acquisitionCost);
    const salvageValue = body.salvageValue ? Number(body.salvageValue) : 0;
    const bookValue = acquisitionCost - salvageValue;
    const [result] = await db.insert(fixedAssets).values({
      tenantId,
      inventoryNumber: body.inventoryNumber,
      name: body.name,
      category: body.category || null,
      acquisitionDate: body.acquisitionDate,
      acquisitionCost: String(acquisitionCost),
      salvageValue: String(salvageValue),
      usefulLifeMonths: String(body.usefulLifeMonths),
      amortizationMethod: body.amortizationMethod || 'straight_line',
      bookValue: String(bookValue),
      location: body.location || null,
      notes: body.notes || null,
    }).returning();
    return NextResponse.json({ ...result, acquisitionCost: Number(result.acquisitionCost), salvageValue: Number(result.salvageValue), bookValue: Number(result.bookValue) }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
