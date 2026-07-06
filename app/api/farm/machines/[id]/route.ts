import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { machines, machineServices } from '@/lib/db/schema/machines';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, desc } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    const existing = await db.select().from(machines).where(and(eq(machines.id, id), eq(machines.tenantId, tenantId))).limit(1);
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.update(machines).set({ name: body.name, type: body.type, make: body.make, model: body.model, year: body.year ? String(body.year) : null, plateNumber: body.plateNumber, engineHours: body.engineHours !== undefined ? String(body.engineHours) : undefined, fuelType: body.fuelType, status: body.status, notes: body.notes }).where(eq(machines.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(machines).where(eq(machines.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function GET(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    const [machine] = await db.select().from(machines).where(eq(machines.id, id)).limit(1);
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const services = await db.select().from(machineServices).where(eq(machineServices.machineId, id)).orderBy(desc(machineServices.date));
    return NextResponse.json({ ...machine, engineHours: Number(machine.engineHours), services });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
