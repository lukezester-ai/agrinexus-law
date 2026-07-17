import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { payrollBatches, payrollItems, employees } from '@/lib/db/schema/hr';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, asc } from 'drizzle-orm';
import { calculatePayrollItem } from '@/lib/payroll/calculator';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const rows = await db.select().from(payrollBatches)
      .where(eq(payrollBatches.tenantId, tenantId))
      .orderBy(desc(payrollBatches.month));
    return NextResponse.json(rows.map((r: any) => ({
      ...r,
      totalGross: Number(r.totalGross),
      totalEmployeeInsurance: Number(r.totalEmployeeInsurance),
      totalEmployerInsurance: Number(r.totalEmployerInsurance),
      totalTax: Number(r.totalTax),
      totalNet: Number(r.totalNet),
      totalEmployerCost: Number(r.totalEmployerCost),
    })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { month } = body;
    if (!month) return NextResponse.json({ error: 'month is required' }, { status: 400 });

    const { db } = getDb();

    const activeEmployees = await db.select().from(employees)
      .where(eq(employees.tenantId, tenantId));

    if (activeEmployees.length === 0) {
      return NextResponse.json({ error: 'Няма активни служители' }, { status: 400 });
    }

    const [batch] = await db.insert(payrollBatches).values({
      tenantId,
      month,
      status: 'draft',
    }).returning();

    const workingDays = 22;
    const items = [];

    for (const emp of activeEmployees) {
      const baseSalary = Number(emp.salary) || 0;
      const calc = calculatePayrollItem({
        baseSalary,
        workingDays,
        workedDays: workingDays,
        bonus: 0,
        contractType: emp.contractType || 'full_time',
      });

      const employeeName = `${emp.firstName} ${emp.lastName}`;

      items.push({
        tenantId,
        batchId: batch.id,
        employeeId: emp.id,
        employeeName,
        baseSalary: String(baseSalary),
        workingDays: String(workingDays),
        workedDays: String(workingDays),
        bonus: '0',
        gross: String(calc.gross),
        insuranceBase: String(calc.insuranceBase),
        employeeInsurance: String(calc.employeeInsurance),
        employerInsurance: String(calc.employerInsurance),
        incomeTax: String(calc.incomeTax),
        net: String(calc.net),
        employerCost: String(calc.employerCost),
        hasWarning: calc.hasWarning,
        warning: calc.warning,
      });
    }

    if (items.length > 0) {
      await db.insert(payrollItems).values(items);
    }

    const totalGross = items.reduce((s, i) => s + Number(i.gross), 0);
    const totalEmployeeInsurance = items.reduce((s, i) => s + Number(i.employeeInsurance), 0);
    const totalEmployerInsurance = items.reduce((s, i) => s + Number(i.employerInsurance), 0);
    const totalTax = items.reduce((s, i) => s + Number(i.incomeTax), 0);
    const totalNet = items.reduce((s, i) => s + Number(i.net), 0);
    const totalEmployerCost = items.reduce((s, i) => s + Number(i.employerCost), 0);

    await db.update(payrollBatches).set({
      totalGross: String(totalGross),
      totalEmployeeInsurance: String(totalEmployeeInsurance),
      totalEmployerInsurance: String(totalEmployerInsurance),
      totalTax: String(totalTax),
      totalNet: String(totalNet),
      totalEmployerCost: String(totalEmployerCost),
    }).where(eq(payrollBatches.id, batch.id));

    const [updated] = await db.select().from(payrollBatches).where(eq(payrollBatches.id, batch.id));

    return NextResponse.json(updated, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
