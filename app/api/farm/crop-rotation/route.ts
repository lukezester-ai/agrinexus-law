import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { cropRotationPlans } from '@/lib/db/schema/crop_rotation';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and } from 'drizzle-orm';

const ROTATION_RULES: Record<string, string[]> = {
  'Пшеница': ['Рапица', 'Слънчоглед', 'Бобови', 'Царевица', 'Ечемик'],
  'Ечемик': ['Рапица', 'Слънчоглед', 'Бобови', 'Царевица'],
  'Царевица': ['Пшеница', 'Ечемик', 'Бобови', 'Слънчоглед'],
  'Слънчоглед': ['Пшеница', 'Ечемик', 'Царевица', 'Бобови'],
  'Рапица': ['Пшеница', 'Ечемик', 'Бобови'],
  'Бобови': ['Пшеница', 'Ечемик', 'Царевица', 'Слънчоглед', 'Рапица'],
};

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db.select().from(cropRotationPlans).where(eq(cropRotationPlans.tenantId, tenantId)).orderBy(desc(cropRotationPlans.year), desc(cropRotationPlans.createdAt));
    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(cropRotationPlans).values({
      tenantId, fieldId: body.fieldId, year: body.year, plannedCrop: body.plannedCrop,
      cropVariety: body.cropVariety || null, previousCrop: body.previousCrop || null,
      status: body.status || 'planned', notes: body.notes || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    await db.update(cropRotationPlans).set({
      plannedCrop: body.plannedCrop, cropVariety: body.cropVariety, previousCrop: body.previousCrop,
      status: body.status, notes: body.notes,
    }).where(and(eq(cropRotationPlans.id, body.id), eq(cropRotationPlans.tenantId, tenantId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(cropRotationPlans).where(eq(cropRotationPlans.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
