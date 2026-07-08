import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { insuranceClaims } from '@/lib/db/schema/insurance';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db
      .update(insuranceClaims)
      .set({
        description: body.description, amountClaimed: body.amountClaimed ? String(body.amountClaimed) : undefined,
        amountSettled: body.amountSettled ? String(body.amountSettled) : null,
        status: body.status, notes: body.notes, updatedAt: new Date(),
      })
      .where(and(eq(insuranceClaims.id, id), eq(insuranceClaims.tenantId, tenantId)))
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
    await db.delete(insuranceClaims).where(and(eq(insuranceClaims.id, id), eq(insuranceClaims.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
