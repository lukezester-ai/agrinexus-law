import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { contracts } from '@/lib/db/schema/contracts';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();
    const [doc] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)))
      .limit(1);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db
      .update(contracts)
      .set({
        status: body.status, notes: body.notes,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        documentId: body.documentId,
        updatedAt: new Date(),
      })
      .where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)))
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
    await db.delete(contracts).where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
