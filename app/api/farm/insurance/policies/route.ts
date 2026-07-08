import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { insurancePolicies } from '@/lib/db/schema/insurance';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(insurancePolicies)
      .where(eq(insurancePolicies.tenantId, tenantId))
      .orderBy(desc(insurancePolicies.startDate));
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

    const count = await db
      .select({ id: insurancePolicies.id })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.tenantId, tenantId))
      .then((r) => r.length + 1);
    const policyNumber = `POL-${String(new Date().getFullYear())}-${String(count).padStart(4, '0')}`;

    const [result] = await db.insert(insurancePolicies).values({
      tenantId, policyNumber, type: body.type || 'crop',
      insurerName: body.insurerName, brokerName: body.brokerName || null,
      insuredEntityType: body.insuredEntityType || null,
      insuredEntityId: body.insuredEntityId || null,
      insuredItemName: body.insuredItemName || null,
      coverageDetails: body.coverageDetails || null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      premiumAmount: String(body.premiumAmount || 0),
      coverageAmount: String(body.coverageAmount || 0),
      deductible: body.deductible ? String(body.deductible) : '0',
      status: body.status || 'active', notes: body.notes || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
