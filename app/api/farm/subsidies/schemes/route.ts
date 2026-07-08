import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { subsidySchemes } from '@/lib/db/schema/subsidies';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(subsidySchemes)
      .where(eq(subsidySchemes.tenantId, tenantId))
      .orderBy(desc(subsidySchemes.season), desc(subsidySchemes.createdAt));
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
    const [result] = await db.insert(subsidySchemes).values({
      tenantId, name: body.name, type: body.type || 'area',
      description: body.description || null,
      ratePerDecare: body.rate_per_decare ? String(body.rate_per_decare) : null,
      maxArea: body.max_area ? String(body.max_area) : null,
      budget: body.budget ? String(body.budget) : null,
      season: body.season, status: body.status || 'active',
      eligibilityRules: body.eligibility_rules || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
