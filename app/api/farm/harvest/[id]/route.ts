import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { harvestRecords } from '@/lib/db/schema/harvest';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    await db.update(harvestRecords).set({
      fieldId: body.fieldId, cropId: body.cropId, date: body.date ? new Date(body.date) : undefined,
      areaDecares: body.areaDecares ? String(body.areaDecares) : undefined,
      yieldAmount: body.yieldAmount ? String(body.yieldAmount) : undefined,
      yieldUnit: body.yieldUnit, moisture: body.moisture ? String(body.moisture) : null, quality: body.quality,
      inventoryItemId: body.inventoryItemId, notes: body.notes,
    }).where(eq(harvestRecords.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(harvestRecords).where(eq(harvestRecords.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
