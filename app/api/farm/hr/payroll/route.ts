import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { payrollBatches, payrollItems, employees } from '@/lib/db/schema/hr';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { autoDepositPdfToArchive } from '@/lib/documents/auto-archive';
import { eq, desc, asc } from 'drizzle-orm';
import { calculatePayrollItem } from '@/lib/payroll/calculator';
import { autoPostPayrollToJournal } from '@/lib/accounting/auto-post-payroll';

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

    // Ticket 3 (P0): Auto-deposit generated payroll summary into Documents archive
    try {
      const summaryHtml = `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"><title>Ведомост за заплати ${month}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f3f4f6}</style></head>body>
        <h1>Разчетна ведомост за заплати — Период: ${month}</h1>
        <p>Общо бруто: <b>${totalGross.toFixed(2)} лв.</b> | Общо нето: <b>${totalNet.toFixed(2)} лв.</b> | Разход работодател: <b>${totalEmployerCost.toFixed(2)} лв.</b></p>
        <table>
          <thead><tr><th>Служител</th><th>Бруто</th><th>Осигуровки</th><th>ДОД</th><th>Нето за изплащане</th></tr></thead>
          <tbody>
            ${items.map(i => `<tr><td>${i.employeeName}</td><td>${Number(i.gross).toFixed(2)} лв.</td><td>${Number(i.employeeInsurance).toFixed(2)} лв.</td><td>${Number(i.incomeTax).toFixed(2)} лв.</td><td><b>${Number(i.net).toFixed(2)} лв.</b></td></tr>`).join('')}
          </tbody>
        </table>
      </body></html>`;

      await autoDepositPdfToArchive({
        tenantId,
        name: `Ведомост_Заплати_${month}_${batch.id.slice(0, 8)}.html`,
        docType: 'payroll',
        category: 'hr',
        linkedModule: 'hr',
        linkedEntityId: batch.id,
        fileBufferOrString: summaryHtml,
        contentType: 'text/html',
        description: `Автоматична разчетна ведомост за заплати за период ${month}`,
        tags: '#ТРЗ #ведомост #заплати #авто-архив',
      });
    } catch (archiveErr) {
      console.error('Failed to auto archive payroll batch:', archiveErr);
    }

    // Ticket 6 (P2): Auto-post double-entry journal entries (604 Разходи за заплати / 421 Персонал / 455 Осигуровки)
    try {
      await autoPostPayrollToJournal({
        tenantId,
        batchId: batch.id,
        month,
        totalGross,
        totalNet,
        totalTax,
        totalEmployeeInsurance,
        totalEmployerInsurance,
        totalEmployerCost,
      });
    } catch (acctErr) {
      console.error('Failed to auto post payroll journal entries:', acctErr);
    }

    return NextResponse.json(updated, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
