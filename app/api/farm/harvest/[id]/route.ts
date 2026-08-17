import { handleApiError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { harvestRecords } from '@/lib/db/schema/harvest';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    await db.update(harvestRecords).set({
      fieldId: body.fieldId, cropId: body.cropId, date: body.date ? new Date(body.date) : undefined,
      areaDecares: body.areaDecares ? String(body.areaDecares) : undefined,
      yieldAmount: body.yieldAmount ? String(body.yieldAmount) : undefined,
      yieldUnit: body.yieldUnit, moisture: body.moisture ? String(body.moisture) : null, quality: body.quality,
      inventoryItemId: body.inventoryItemId, notes: body.notes,
    }).where(and(eq(harvestRecords.id, id), eq(harvestRecords.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return handleApiError(err); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();
    await db.delete(harvestRecords).where(and(eq(harvestRecords.id, id), eq(harvestRecords.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return handleApiError(err); }
}
