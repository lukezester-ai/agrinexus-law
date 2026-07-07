import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { reminders } from '@/lib/db/schema/reminders';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    const [row] = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    await db.update(reminders).set({
      title: body.title,
      description: body.description,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      isCompleted: body.isCompleted,
      entityType: body.entityType,
      entityId: body.entityId,
    }).where(eq(reminders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(reminders).where(eq(reminders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
