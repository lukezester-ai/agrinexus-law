import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { contractTemplates } from '@/lib/db/schema/contracts';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.tenantId, tenantId))
      .orderBy(desc(contractTemplates.createdAt));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(contractTemplates).values({
      tenantId, name: body.name, type: body.type || 'lease',
      content: body.content, description: body.description || null,
      isActive: body.is_active !== false,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
