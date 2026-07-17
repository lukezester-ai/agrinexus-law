import { getDb } from "@/lib/db/db";
import { journalHeaders, journalLines } from "@/lib/db/schema/journal_entries";
import { accountPlan } from "@/lib/db/schema/account_plan";
import { eq, and } from "drizzle-orm";

export interface PayrollJournalParams {
  tenantId: string;
  batchId: string;
  month: string;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalEmployeeInsurance: number;
  totalEmployerInsurance: number;
  totalEmployerCost: number;
}

/**
 * TICKET 6 (P2): Auto-post double-entry journal entries when HR payroll batch is created/calculated.
 */
export async function autoPostPayrollToJournal(params: PayrollJournalParams): Promise<{ headerId: string | null; success: boolean }> {
  try {
    const { db } = getDb();
    const { tenantId, batchId, month, totalGross, totalNet, totalTax, totalEmployeeInsurance, totalEmployerInsurance } = params;

    if (totalGross <= 0) {
      return { headerId: null, success: false };
    }

    // Ensure required accounts exist in accountPlan for this tenant
    const getOrCreateAccount = async (accountNumber: string, name: string, type: string) => {
      const [existing] = await db.select().from(accountPlan).where(
        and(eq(accountPlan.tenantId, tenantId), eq(accountPlan.accountNumber, accountNumber))
      );
      if (existing) return existing.id;

      const [created] = await db.insert(accountPlan).values({
        tenantId,
        accountNumber,
        name,
        type,
        isActive: true,
        isAnalytical: false,
        standard: "NSS",
      }).returning();
      return created.id;
    };

    const acc604Id = await getOrCreateAccount("604", "Разходи за заплати (ТРЗ)", "expense");
    const acc605Id = await getOrCreateAccount("605", "Разходи за осигуровки от работодател", "expense");
    const acc421Id = await getOrCreateAccount("421", "Персонал (Задължения за заплати)", "liability");
    const acc455Id = await getOrCreateAccount("455", "Разкопи/Задължения към бюджета и НОИ/НЗОК", "liability");

    // Check if a journal header already exists for this payroll batch
    const [existingHeader] = await db.select().from(journalHeaders).where(
      and(eq(journalHeaders.tenantId, tenantId), eq(journalHeaders.documentId, batchId))
    );

    let headerId: string;
    if (existingHeader) {
      headerId = existingHeader.id;
      await db.delete(journalLines).where(eq(journalLines.journalId, headerId));
      await db.update(journalHeaders).set({
        description: `Автоматични счетоводни статии по ведомост за заплати за период ${month}`,
        updatedAt: new Date(),
      }).where(eq(journalHeaders.id, headerId));
    } else {
      const [header] = await db.insert(journalHeaders).values({
        tenantId,
        journalNumber: `PAY-${month}-${batchId.slice(0, 6)}`,
        entryDate: new Date(),
        description: `Автоматични счетоводни статии по ведомост за заплати за период ${month}`,
        documentType: "payroll",
        documentId: batchId,
        status: "posted",
        postedAt: new Date(),
      }).returning();
      headerId = header.id;
    }

    const lines = [
      // 1. Debit 604 (Gross salary expense)
      {
        journalId: headerId,
        accountId: acc604Id,
        entryType: "debit",
        amount: String(totalGross.toFixed(2)),
        description: `Начислени брутни заплати по ведомост за ${month}`,
      },
      // 2. Credit 421 (Net payable to personnel)
      {
        journalId: headerId,
        accountId: acc421Id,
        entryType: "credit",
        amount: String(totalNet.toFixed(2)),
        description: `Задължение към персонал за изплащане на нето за ${month}`,
      },
      // 3. Credit 455 (Taxes + Employee Insurance withheld)
      {
        journalId: headerId,
        accountId: acc455Id,
        entryType: "credit",
        amount: String((totalTax + totalEmployeeInsurance).toFixed(2)),
        description: `Удържани ДОД и лични осигуровки за ${month}`,
      },
    ];

    // 4. Employer insurance expense and liability
    if (totalEmployerInsurance > 0) {
      lines.push(
        {
          journalId: headerId,
          accountId: acc605Id,
          entryType: "debit",
          amount: String(totalEmployerInsurance.toFixed(2)),
          description: `Начислени осигуровки за сметка на работодател за ${month}`,
        },
        {
          journalId: headerId,
          accountId: acc455Id,
          entryType: "credit",
          amount: String(totalEmployerInsurance.toFixed(2)),
          description: `Задължение към НОИ/НЗОК за осигуровки от работодател за ${month}`,
        }
      );
    }

    await db.insert(journalLines).values(lines);

    return { headerId, success: true };
  } catch (err) {
    console.error("autoPostPayrollToJournal error:", err);
    return { headerId: null, success: false };
  }
}
