import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { bankAccounts } from '@/lib/db/schema/banking';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const rows = await db.select().from(bankAccounts).where(eq(bankAccounts.tenantId, tenantId)).orderBy(asc(bankAccounts.name));
    return NextResponse.json(rows.map((r: any) => ({ ...r, balance: Number(r.balance) })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(bankAccounts).values({
      tenantId,
      name: body.name,
      institutionName: body.institutionName || null,
      iban: body.iban || null,
      balance: body.balance != null ? String(body.balance) : '0',
      currency: body.currency || 'BGN',
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
