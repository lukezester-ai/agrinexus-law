import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { employees } from '@/lib/db/schema/hr';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();
    await db.update(employees).set({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      position: body.position,
      department: body.department,
      salary: body.salary != null ? String(body.salary) : undefined,
      insuranceCategory: body.insuranceCategory,
      contractType: body.contractType,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive,
    }).where(eq(employees.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(employees).where(eq(employees.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
