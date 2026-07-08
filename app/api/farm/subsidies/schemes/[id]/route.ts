import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { subsidySchemes } from '@/lib/db/schema/subsidies';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();

    const [result] = await db
      .update(subsidySchemes)
      .set({
        name: body.name, type: body.type, description: body.description,
        ratePerDecare: body.rate_per_decare ? String(body.rate_per_decare) : null,
        maxArea: body.max_area ? String(body.max_area) : null,
        budget: body.budget ? String(body.budget) : null,
        season: body.season, status: body.status, isActive: body.is_active,
        eligibilityRules: body.eligibility_rules || null,
        updatedAt: new Date(),
      })
      .where(and(eq(subsidySchemes.id, id), eq(subsidySchemes.tenantId, tenantId)))
      .returning();

    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();
    await db.delete(subsidySchemes).where(and(eq(subsidySchemes.id, id), eq(subsidySchemes.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
