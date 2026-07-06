import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { machineServices } from '@/lib/db/schema/machines';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id: machineId } = await params;
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(machineServices).values({
      tenantId, machineId, date: body.date ? new Date(body.date) : new Date(),
      type: body.type, description: body.description || null,
      cost: body.cost !== undefined ? String(body.cost) : '0',
      hoursAtService: body.hoursAtService !== undefined ? String(body.hoursAtService) : null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function GET(req: NextRequest, { params }: any) {
  try {
    const { id: machineId } = await params;
    const { db } = getDb();
    const services = await db.select().from(machineServices).where(eq(machineServices.machineId, machineId)).orderBy(desc(machineServices.date));
    return NextResponse.json(services.map((s: any) => ({ ...s, cost: Number(s.cost), hoursAtService: s.hoursAtService ? Number(s.hoursAtService) : null, date: s.date })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'service id required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(machineServices).where(eq(machineServices.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
