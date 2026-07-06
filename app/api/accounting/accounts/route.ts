import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq } from 'drizzle-orm';

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
