import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { fixedAssets } from '@/lib/db/schema/fixed_assets';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    const [asset] = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id)).limit(1);
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      ...asset,
      acquisitionCost: Number(asset.acquisitionCost),
      salvageValue: Number(asset.salvageValue),
      usefulLifeMonths: Number(asset.usefulLifeMonths),
      accumulatedAmortization: Number(asset.accumulatedAmortization),
      bookValue: Number(asset.bookValue),
    });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    const existing = await db.select().from(fixedAssets).where(and(eq(fixedAssets.id, id), eq(fixedAssets.tenantId, tenantId))).limit(1);
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const acquisitionCost = body.acquisitionCost !== undefined ? Number(body.acquisitionCost) : Number(existing[0].acquisitionCost);
    const salvageValue = body.salvageValue !== undefined ? Number(body.salvageValue) : Number(existing[0].salvageValue);
    const bookValue = acquisitionCost - salvageValue;
    await db.update(fixedAssets).set({
      inventoryNumber: body.inventoryNumber,
      name: body.name,
      category: body.category,
      acquisitionDate: body.acquisitionDate,
      acquisitionCost: String(acquisitionCost),
      salvageValue: String(salvageValue),
      usefulLifeMonths: body.usefulLifeMonths !== undefined ? String(body.usefulLifeMonths) : undefined,
      amortizationMethod: body.amortizationMethod,
      location: body.location,
      notes: body.notes,
      bookValue: String(bookValue),
    }).where(eq(fixedAssets.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(fixedAssets).where(eq(fixedAssets.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
