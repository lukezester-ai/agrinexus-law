import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { contractTemplates } from '@/lib/db/schema/contracts';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db
      .update(contractTemplates)
      .set({ name: body.name, type: body.type, content: body.content, description: body.description, isActive: body.is_active, updatedAt: new Date() })
      .where(and(eq(contractTemplates.id, id), eq(contractTemplates.tenantId, tenantId)))
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
    await db.delete(contractTemplates).where(and(eq(contractTemplates.id, id), eq(contractTemplates.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
