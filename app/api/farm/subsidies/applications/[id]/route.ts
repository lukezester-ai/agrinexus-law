import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { subsidyApplications } from '@/lib/db/schema/subsidies';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();

    const updateData: any = { updatedAt: new Date() };
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.fields) {
      const totalArea = body.fields.reduce((s: number, f: any) => s + Number(f.area || 0), 0);
      updateData.fields = body.fields;
      updateData.totalArea = String(totalArea);
    }
    if (body.submission_date) updateData.submissionDate = new Date(body.submission_date);
    if (body.approval_date) updateData.approvalDate = new Date(body.approval_date);
    if (body.payment_date) updateData.paymentDate = new Date(body.payment_date);
    if (body.amount_received !== undefined) updateData.amountReceived = String(body.amount_received);

    const [result] = await db
      .update(subsidyApplications)
      .set(updateData)
      .where(and(eq(subsidyApplications.id, id), eq(subsidyApplications.tenantId, tenantId)))
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
    await db.delete(subsidyApplications).where(and(eq(subsidyApplications.id, id), eq(subsidyApplications.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
