import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { leaveRequests, employees } from '@/lib/db/schema/hr';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, asc, SQL, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();

    const rows = await db.select({
      id: leaveRequests.id,
      tenantId: leaveRequests.tenantId,
      employeeId: leaveRequests.employeeId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      type: leaveRequests.type,
      daysRequested: leaveRequests.daysRequested,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      createdAt: leaveRequests.createdAt,
      updatedAt: leaveRequests.updatedAt,
      employeeName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(eq(leaveRequests.tenantId, tenantId))
    .orderBy(asc(leaveRequests.createdAt));

    return NextResponse.json(rows.map((r: any) => ({ ...r, daysRequested: r.daysRequested ? Number(r.daysRequested) : null })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(leaveRequests).values({
      tenantId,
      employeeId: body.employeeId,
      startDate: body.startDate,
      endDate: body.endDate,
      type: body.type,
      daysRequested: body.daysRequested != null ? String(body.daysRequested) : null,
      reason: body.reason || null,
      status: body.status || 'pending',
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    const { db } = getDb();
    await db.update(leaveRequests).set({ status }).where(eq(leaveRequests.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
