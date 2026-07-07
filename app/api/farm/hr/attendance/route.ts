import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { attendanceRecords, employees } from '@/lib/db/schema/hr';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, like, SQL, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const { db } = getDb();

    const conditions: SQL[] = [eq(attendanceRecords.tenantId, tenantId)];
    if (employeeId) conditions.push(eq(attendanceRecords.employeeId, employeeId));
    if (month) conditions.push(like(attendanceRecords.date, `${month}%`));

    const rows = await db.select({
      id: attendanceRecords.id,
      tenantId: attendanceRecords.tenantId,
      employeeId: attendanceRecords.employeeId,
      date: attendanceRecords.date,
      hoursWorked: attendanceRecords.hoursWorked,
      type: attendanceRecords.type,
      description: attendanceRecords.description,
      createdAt: attendanceRecords.createdAt,
      employeeName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(attendanceRecords)
    .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(asc(attendanceRecords.date));

    return NextResponse.json(rows.map((r: any) => ({ ...r, hoursWorked: Number(r.hoursWorked) })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(attendanceRecords).values({
      tenantId,
      employeeId: body.employeeId,
      date: body.date,
      hoursWorked: body.hoursWorked != null ? String(body.hoursWorked) : '0',
      type: body.type || 'worked',
      description: body.description || null,
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
