import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { harvestRecords } from '@/lib/db/schema/harvest';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db.select().from(harvestRecords).where(eq(harvestRecords.tenantId, tenantId)).orderBy(desc(harvestRecords.date));
    return NextResponse.json(result.map((r: any) => ({ ...r, areaDecares: Number(r.areaDecares), yieldAmount: Number(r.yieldAmount), moisture: r.moisture ? Number(r.moisture) : null })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(harvestRecords).values({
      tenantId, fieldId: body.fieldId || null, cropId: body.cropId || null, date: body.date ? new Date(body.date) : new Date(),
      areaDecares: String(body.areaDecares), yieldAmount: String(body.yieldAmount), yieldUnit: body.yieldUnit || 'kg',
      moisture: body.moisture ? String(body.moisture) : null, quality: body.quality || null,
      inventoryItemId: body.inventoryItemId || null, notes: body.notes || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
