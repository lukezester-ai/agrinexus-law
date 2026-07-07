import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { reminders } from '@/lib/db/schema/reminders';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const rows = await db.select().from(reminders).where(eq(reminders.tenantId, tenantId)).orderBy(desc(reminders.dueDate));
    return NextResponse.json(rows);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(reminders).values({
      tenantId,
      title: body.title,
      description: body.description || null,
      dueDate: new Date(body.dueDate),
      isCompleted: body.isCompleted || 'false',
      entityType: body.entityType || null,
      entityId: body.entityId || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(reminders).where(eq(reminders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
