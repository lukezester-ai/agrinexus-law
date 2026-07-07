import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { notifications } from '@/lib/db/schema/notifications';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const { db } = getDb();
    const where = unreadOnly
      ? and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, 'false'))
      : eq(notifications.tenantId, tenantId);
    const rows = await db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(50);
    return NextResponse.json(rows);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(notifications).values({
      tenantId,
      type: body.type,
      title: body.title,
      message: body.message || null,
      link: body.link || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    if (body.all) {
      await db.update(notifications).set({ isRead: 'true' }).where(and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, 'false')));
    } else if (body.id) {
      await db.update(notifications).set({ isRead: 'true' }).where(eq(notifications.id, body.id));
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
