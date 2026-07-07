import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { payrollBatches, payrollItems, employees } from '@/lib/db/schema/hr';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    const [batch] = await db.select().from(payrollBatches).where(eq(payrollBatches.id, id));
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = await db.select({
      id: payrollItems.id,
      tenantId: payrollItems.tenantId,
      batchId: payrollItems.batchId,
      employeeId: payrollItems.employeeId,
      employeeName: payrollItems.employeeName,
      baseSalary: payrollItems.baseSalary,
      workingDays: payrollItems.workingDays,
      workedDays: payrollItems.workedDays,
      bonus: payrollItems.bonus,
      gross: payrollItems.gross,
      insuranceBase: payrollItems.insuranceBase,
      employeeInsurance: payrollItems.employeeInsurance,
      employerInsurance: payrollItems.employerInsurance,
      incomeTax: payrollItems.incomeTax,
      net: payrollItems.net,
      employerCost: payrollItems.employerCost,
      hasWarning: payrollItems.hasWarning,
      warning: payrollItems.warning,
      createdAt: payrollItems.createdAt,
    })
    .from(payrollItems)
    .where(eq(payrollItems.batchId, id))
    .orderBy(asc(payrollItems.employeeName));

    return NextResponse.json({
      ...batch,
      totalGross: Number(batch.totalGross),
      totalEmployeeInsurance: Number(batch.totalEmployeeInsurance),
      totalEmployerInsurance: Number(batch.totalEmployerInsurance),
      totalTax: Number(batch.totalTax),
      totalNet: Number(batch.totalNet),
      totalEmployerCost: Number(batch.totalEmployerCost),
      items: items.map((i: any) => ({
        ...i,
        baseSalary: Number(i.baseSalary),
        workingDays: Number(i.workingDays),
        workedDays: Number(i.workedDays),
        bonus: Number(i.bonus),
        gross: Number(i.gross),
        insuranceBase: Number(i.insuranceBase),
        employeeInsurance: Number(i.employeeInsurance),
        employerInsurance: Number(i.employerInsurance),
        incomeTax: Number(i.incomeTax),
        net: Number(i.net),
        employerCost: Number(i.employerCost),
      })),
    });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();

    const updates: any = {};
    if (body.status) updates.status = body.status;

    await db.update(payrollBatches).set(updates).where(eq(payrollBatches.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    const { db } = getDb();
    await db.delete(payrollBatches).where(eq(payrollBatches.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
