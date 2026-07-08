import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { insurancePolicies } from '@/lib/db/schema/insurance';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db
      .update(insurancePolicies)
      .set({
        type: body.type, insurerName: body.insurerName, brokerName: body.brokerName,
        insuredEntityType: body.insuredEntityType, insuredEntityId: body.insuredEntityId,
        insuredItemName: body.insuredItemName, coverageDetails: body.coverageDetails,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        premiumAmount: body.premiumAmount ? String(body.premiumAmount) : undefined,
        coverageAmount: body.coverageAmount ? String(body.coverageAmount) : undefined,
        deductible: body.deductible ? String(body.deductible) : undefined,
        status: body.status, notes: body.notes, updatedAt: new Date(),
      })
      .where(and(eq(insurancePolicies.id, id), eq(insurancePolicies.tenantId, tenantId)))
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
    await db.delete(insurancePolicies).where(and(eq(insurancePolicies.id, id), eq(insurancePolicies.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
