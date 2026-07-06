import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { fields } from '@/lib/db/schema/fields';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(fields)
      .where(eq(fields.tenantId, tenantId))
      .orderBy(desc(fields.createdAt));
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
      .insert(fields)
      .values({
        tenantId,
        name: body.name,
        location: body.location || null,
        areaDecares: String(body.areaDecares || 0),
        cadastralId: body.cadastralId || null,
        physicalBlockId: body.physicalBlockId || null,
        crop: body.crop || null,
        cropVariety: body.cropVariety || null,
        soilType: body.soilType || null,
        ownershipType: body.ownershipType || 'own',
        ownerName: body.ownerName || null,
        leaseEndDate: body.leaseEndDate ? new Date(body.leaseEndDate) : null,
        geometry: body.geometry || null,
        centroid: body.centroid || null,
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { db } = getDb();

    await db.update(fields).set({
      name: data.name,
      location: data.location,
      areaDecares: data.areaDecares !== undefined ? String(data.areaDecares) : undefined,
      cadastralId: data.cadastralId,
      physicalBlockId: data.physicalBlockId,
      crop: data.crop,
      cropVariety: data.cropVariety,
      soilType: data.soilType,
      ownershipType: data.ownershipType,
      ownerName: data.ownerName,
      geometry: data.geometry,
      centroid: data.centroid,
      notes: data.notes,
    }).where(eq(fields.id, id));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(fields).where(eq(fields.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
