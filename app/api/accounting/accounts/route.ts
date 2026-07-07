import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.tenantId, tenantId))
      .orderBy(accountPlan.accountNumber);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const [created] = await db
      .insert(accountPlan)
      .values({ ...body, tenantId })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const [updated] = await db
      .update(accountPlan)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const [deleted] = await db
      .delete(accountPlan)
      .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)))
      .returning();
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
