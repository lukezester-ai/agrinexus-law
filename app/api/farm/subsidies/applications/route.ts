import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { subsidyApplications, subsidySchemes } from '@/lib/db/schema/subsidies';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select({
        app: subsidyApplications,
        schemeName: subsidySchemes.name,
        schemeType: subsidySchemes.type,
      })
      .from(subsidyApplications)
      .leftJoin(subsidySchemes, eq(subsidyApplications.schemeId, subsidySchemes.id))
      .where(eq(subsidyApplications.tenantId, tenantId))
      .orderBy(desc(subsidyApplications.season), desc(subsidyApplications.createdAt));
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

    const season = body.season || String(new Date().getFullYear());
    const count = await db
      .select({ id: subsidyApplications.id })
      .from(subsidyApplications)
      .where(and(
        eq(subsidyApplications.tenantId, tenantId),
        eq(subsidyApplications.season, season),
      ))
      .then((r) => r.length + 1);
    const applicationNumber = `ДФЗ-${season}-${String(count).padStart(4, '0')}`;

    const [scheme] = await db
      .select()
      .from(subsidySchemes)
      .where(eq(subsidySchemes.id, body.schemeId))
      .limit(1);

    const fields = body.fields || [];
    const totalArea = fields.reduce((s: number, f: any) => s + Number(f.area || 0), 0);
    const rate = scheme?.ratePerDecare ? Number(scheme.ratePerDecare) : 0;
    const amountExpected = totalArea * rate;

    const [result] = await db.insert(subsidyApplications).values({
      tenantId, schemeId: body.schemeId, season,
      applicationNumber, status: body.status || 'draft',
      totalArea: String(totalArea),
      amountExpected: String(amountExpected),
      fields: fields, notes: body.notes || null,
      submissionDate: body.submission_date ? new Date(body.submission_date) : null,
    }).returning();

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
