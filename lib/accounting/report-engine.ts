import { getDb } from '@/lib/db/db';
import { journalHeaders, journalLines } from '@/lib/db/schema/journal_entries';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export class ReportEngine {
  static async generateTrialBalance(tenantId: string, asOf: Date) {
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

    return results.map((r) => ({
      accountNumber: r.accountNumber,
      accountName: r.accountName,
      accountType: r.accountType,
      debit: Number(r.debit),
      credit: Number(r.credit),
      balance: Number(r.debit) - Number(r.credit),
    }));
  }

  static async generateBalanceSheet(tenantId: string, asOf: Date) {
    const trial = await this.generateTrialBalance(tenantId, asOf);

    const assets = trial
      .filter((r) => r.accountType === 'asset')
      .map((r) => ({ ...r, balance: r.debit - r.credit }));

    const liabilities = trial
      .filter((r) => r.accountType === 'liability')
      .map((r) => ({ ...r, balance: r.credit - r.debit }));

    const equity = trial
      .filter((r) => r.accountType === 'equity')
      .map((r) => ({ ...r, balance: r.credit - r.debit }));

    return {
      assets: { accounts: assets, total: assets.reduce((s, a) => s + a.balance, 0) },
      liabilities: { accounts: liabilities, total: liabilities.reduce((s, a) => s + a.balance, 0) },
      equity: { accounts: equity, total: equity.reduce((s, a) => s + a.balance, 0) },
    };
  }

  static async generatePnL(tenantId: string, startDate: Date, endDate: Date) {
    const trial = await this.generateTrialBalance(tenantId, endDate);
    const startTrial = await this.generateTrialBalance(tenantId, startDate);

    const calcPeriod = (type: string) => {
      const end = trial.filter((r) => r.accountType === type);
      const start = startTrial.filter((r) => r.accountType === type);
      const startMap = new Map(start.map((r) => [r.accountNumber, r]));

      return end.map((r) => {
        const startBalance = startMap.get(r.accountNumber)?.balance ?? 0;
        return {
          ...r,
          startBalance,
          periodBalance: r.balance - startBalance,
        };
      });
    };

    const income = calcPeriod('income');
    const expenses = calcPeriod('expense');

    const totalIncome = income.reduce((s, r) => s + Math.max(0, r.periodBalance), 0);
    const totalExpenses = expenses.reduce((s, r) => s + Math.max(0, r.periodBalance), 0);

    return {
      income: { accounts: income, total: totalIncome },
      expenses: { accounts: expenses, total: totalExpenses },
      netProfit: totalIncome - totalExpenses,
    };
  }
}
