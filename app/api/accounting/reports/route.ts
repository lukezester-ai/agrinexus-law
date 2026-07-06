import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { journalHeaders, journalLines } from '@/lib/db/schema/journal_entries';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'trial';
    const asOf = searchParams.get('asOf') ? new Date(searchParams.get('asOf')!) : new Date();
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    const { db } = getDb();

    const results = await db
      .select({
        accountNumber: accountPlan.accountNumber,
        accountName: accountPlan.name,
        accountType: accountPlan.type,
        debit: sql`COALESCE(SUM(CASE WHEN ${journalLines.entryType} = 'debit' THEN ${journalLines.amount}::numeric ELSE 0 END), 0)`,
        credit: sql`COALESCE(SUM(CASE WHEN ${journalLines.entryType} = 'credit' THEN ${journalLines.amount}::numeric ELSE 0 END), 0)`,
      })
      .from(accountPlan)
      .leftJoin(journalLines, eq(journalLines.accountId, accountPlan.id))
      .leftJoin(journalHeaders, and(
        eq(journalHeaders.id, journalLines.journalId),
        eq(journalHeaders.tenantId, tenantId),
        eq(journalHeaders.status, 'posted'),
        lte(journalHeaders.entryDate, asOf),
      ))
      .where(eq(accountPlan.tenantId, tenantId))
      .groupBy(accountPlan.accountNumber, accountPlan.name, accountPlan.type, accountPlan.id)
      .orderBy(accountPlan.accountNumber);

    const trial = results.map((r: any) => ({
      accountNumber: r.accountNumber,
      accountName: r.accountName,
      accountType: r.accountType,
      debit: Number(r.debit),
      credit: Number(r.credit),
      balance: Number(r.debit) - Number(r.credit),
    }));

    if (type === 'trial') return NextResponse.json(trial);

    const assets = trial.filter((r: any) => r.accountType === 'asset').map((r: any) => ({ ...r, balance: r.debit - r.credit }));
    const liabilities = trial.filter((r: any) => r.accountType === 'liability').map((r: any) => ({ ...r, balance: r.credit - r.debit }));
    const equity = trial.filter((r: any) => r.accountType === 'equity').map((r: any) => ({ ...r, balance: r.credit - r.debit }));

    if (type === 'balance') {
      return NextResponse.json({
        assets: { accounts: assets, total: assets.reduce((s: number, a: any) => s + a.balance, 0) },
        liabilities: { accounts: liabilities, total: liabilities.reduce((s: number, a: any) => s + a.balance, 0) },
        equity: { accounts: equity, total: equity.reduce((s: number, a: any) => s + a.balance, 0) },
      });
    }

    const calcPeriod = (type: string) => {
      const end = trial.filter((r: any) => r.accountType === type);
      const start = results.filter((r: any) => r.accountType === type);
      const startMap = new Map(start.map((r: any) => [r.accountNumber, r]));
      return end.map((r: any) => ({
        ...r,
        startBalance: startMap.get(r.accountNumber)?.balance ?? 0,
        periodBalance: r.balance - (startMap.get(r.accountNumber)?.balance ?? 0),
      }));
    };

    const income = calcPeriod('income');
    const expenses = calcPeriod('expense');
    const totalIncome = income.reduce((s: number, r: any) => s + Math.max(0, r.periodBalance), 0);
    const totalExpenses = expenses.reduce((s: number, r: any) => s + Math.max(0, r.periodBalance), 0);

    return NextResponse.json({
      income: { accounts: income, total: totalIncome },
      expenses: { accounts: expenses, total: totalExpenses },
      netProfit: totalIncome - totalExpenses,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
