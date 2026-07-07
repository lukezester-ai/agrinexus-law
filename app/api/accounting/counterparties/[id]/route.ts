import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { counterparties } from '@/lib/db/schema/counterparties';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const [updated] = await db
      .update(counterparties)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(counterparties.id, id), eq(counterparties.tenantId, tenantId)))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const [deleted] = await db
      .delete(counterparties)
      .where(and(eq(counterparties.id, id), eq(counterparties.tenantId, tenantId)))
      .returning();
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
