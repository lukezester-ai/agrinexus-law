import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { harvestRecords } from '@/lib/db/schema/harvest';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { fields } from '@/lib/db/schema/fields';
import { createInventoryFromHarvest } from '@/lib/farm/harvest-to-inventory';
import { autoLogCropRotationFromHarvest } from '@/lib/farm/harvest-to-rotation';
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

    let fieldName: string | null = null;
    if (body.fieldId) {
      const [field] = await db.select({ name: fields.name }).from(fields).where(eq(fields.id, body.fieldId)).limit(1);
      if (field) fieldName = field.name;
    }

    const invItemId = await createInventoryFromHarvest({
      tenantId,
      cropId: body.cropId || null,
      yieldAmount: Number(body.yieldAmount),
      yieldUnit: body.yieldUnit || 'kg',
      fieldName,
      date: body.date ? new Date(body.date) : new Date(),
    });

    await db.update(harvestRecords).set({ inventoryItemId: invItemId }).where(eq(harvestRecords.id, result.id));

    // Ticket 4 (P1): Auto-log in Crop Rotation and set predecessor for next year
    try {
      if (body.fieldId) {
        await autoLogCropRotationFromHarvest({
          tenantId,
          fieldId: body.fieldId,
          cropId: body.cropId || null,
          yieldAmount: Number(body.yieldAmount),
          yieldUnit: body.yieldUnit || 'kg',
          date: body.date ? new Date(body.date) : new Date(),
        });
      }
    } catch (rotationErr) {
      console.error('autoLogCropRotationFromHarvest error:', rotationErr);
    }

    return NextResponse.json({ ...result, inventoryItemId: invItemId }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
