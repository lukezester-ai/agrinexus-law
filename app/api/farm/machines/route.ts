import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { machines } from '@/lib/db/schema/machines';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db.select().from(machines).where(eq(machines.tenantId, tenantId)).orderBy(desc(machines.createdAt));
    return NextResponse.json(result.map((m: any) => ({ ...m, engineHours: Number(m.engineHours), year: m.year ? Number(m.year) : null })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(machines).values({ tenantId, name: body.name, type: body.type, make: body.make || null, model: body.model || null, year: body.year ? String(body.year) : null, plateNumber: body.plateNumber || null, engineHours: String(body.engineHours || 0), fuelType: body.fuelType || null, status: body.status || 'active', notes: body.notes || null }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
