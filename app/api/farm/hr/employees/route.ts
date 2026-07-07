import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { employees } from '@/lib/db/schema/hr';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, asc, and } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const rows = await db.select().from(employees)
      .where(eq(employees.tenantId, tenantId))
      .orderBy(asc(employees.lastName), asc(employees.firstName));
    return NextResponse.json(rows.map((r: any) => ({ ...r, salary: r.salary ? Number(r.salary) : null })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(employees).values({
      tenantId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      position: body.position || null,
      department: body.department || null,
      salary: body.salary != null ? String(body.salary) : null,
      insuranceCategory: body.insuranceCategory || 'third',
      contractType: body.contractType || 'full_time',
      startDate: body.startDate,
      endDate: body.endDate || null,
      isActive: body.isActive ?? 'true',
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
