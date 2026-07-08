import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { insuranceClaims, insurancePolicies } from '@/lib/db/schema/insurance';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select({
        claim: insuranceClaims,
        policyNumber: insurancePolicies.policyNumber,
        insurerName: insurancePolicies.insurerName,
        policyType: insurancePolicies.type,
      })
      .from(insuranceClaims)
      .leftJoin(insurancePolicies, eq(insuranceClaims.policyId, insurancePolicies.id))
      .where(eq(insuranceClaims.tenantId, tenantId))
      .orderBy(desc(insuranceClaims.claimDate));
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
      .select({ id: insuranceClaims.id })
      .from(insuranceClaims)
      .where(eq(insuranceClaims.tenantId, tenantId))
      .then((r) => r.length + 1);
    const claimNumber = `CLM-${String(new Date().getFullYear())}-${String(count).padStart(4, '0')}`;

    const [result] = await db.insert(insuranceClaims).values({
      tenantId, policyId: body.policyId, claimNumber,
      claimDate: body.claimDate ? new Date(body.claimDate) : new Date(),
      description: body.description, amountClaimed: String(body.amountClaimed || 0),
      amountSettled: body.amountSettled ? String(body.amountSettled) : null,
      status: body.status || 'filed', notes: body.notes || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
