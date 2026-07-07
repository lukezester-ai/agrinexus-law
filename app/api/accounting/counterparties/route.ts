import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { counterparties } from '@/lib/db/schema/counterparties';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(counterparties)
      .where(eq(counterparties.tenantId, tenantId))
      .orderBy(counterparties.name);
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
      .insert(counterparties)
      .values({ ...body, tenantId })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
