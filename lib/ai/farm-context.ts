import { getDb } from "@/lib/db/db";
import { fields } from "@/lib/db/schema/fields";
import { machines } from "@/lib/db/schema/machines";
import { inventoryItems } from "@/lib/db/schema/inventory";
import { bankAccounts } from "@/lib/db/schema/banking";
import { invoices, purchaseInvoices } from "@/lib/db/schema/invoices";
import { contracts } from "@/lib/db/schema/contracts";
import { subsidyApplications } from "@/lib/db/schema/subsidies";
import { insurancePolicies } from "@/lib/db/schema/insurance";
import { employees } from "@/lib/db/schema/hr";
import { eq } from "drizzle-orm";
import type { CharacterId } from "@/lib/characters";

/**
 * TICKET 7 (P1): Dynamically fetch relevant tenant/farm database context for specific AI persona.
 */
export async function getFarmContextForPersona(tenantId: string, personaId: CharacterId): Promise<string> {
  try {
    const { db } = getDb();

    if (personaId === "boris") {
      // Field Specialist Boris: Fields, Crops, Machines, Inventory
      const activeFields = await db.select().from(fields).where(eq(fields.tenantId, tenantId));
      const activeMachines = await db.select().from(machines).where(eq(machines.tenantId, tenantId));
      const inventory = await db.select().from(inventoryItems).where(eq(inventoryItems.tenantId, tenantId));

      let totalDecares = 0;
      const cropMap: Record<string, number> = {};
      activeFields.forEach(f => {
        const da = Number(f.areaDecares || 0);
        totalDecares += da;
        if (f.crop) {
          cropMap[f.crop] = (cropMap[f.crop] || 0) + da;
        }
      });

      const cropSummary = Object.entries(cropMap)
        .map(([c, da]) => `${c}: ${da.toFixed(1)} дка`)
        .join(", ");

      const machineSummary = activeMachines.slice(0, 5)
        .map(m => `${m.name} (${m.type || "техника"})`)
        .join(", ");

      const stockSummary = inventory.slice(0, 6)
        .map(i => `${i.name}: ${i.currentStock} ${i.unitOfMeasure}`)
        .join(", ");

      return `[ДИНАМИЧЕН ФАРМ КОНТЕКСТ ЗА БОРИС]:
- Общо обработваема площ: ${totalDecares.toFixed(1)} дка в ${activeFields.length} парцела.
- Разпределение по култури: ${cropSummary || "Няма въведени култури"}.
- Налична земеделска техника (${activeMachines.length} бр): ${machineSummary || "Няма въведени машини"}.
- Складови наличности (ПРЗ, торове, семена): ${stockSummary || "Няма въведени артикули в склада"}.
Използвай тези реални данни на стопанството, когато отговаряш на въпроси за агротехника, пръскания и обработки!`;
    }

    if (personaId === "viktoria") {
      // Financial Analyst Viktoria: Bank accounts, Invoices, HR payroll
      const accounts = await db.select().from(bankAccounts).where(eq(bankAccounts.tenantId, tenantId));
      const sales = await db.select().from(invoices).where(eq(invoices.tenantId, tenantId));
      const purchases = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId));
      const emps = await db.select().from(employees).where(eq(employees.tenantId, tenantId));

      let totalBgn = 0;
      let totalEur = 0;
      accounts.forEach(a => {
        const bal = parseFloat(String(a.balance || 0));
        if (a.currency === "EUR") totalEur += bal;
        else totalBgn += bal;
      });

      let pendingSales = 0;
      sales.forEach(s => {
        if (s.status === "issued" || s.status === "unpaid") pendingSales += parseFloat(String(s.totalAmount || 0));
      });

      let pendingPurchases = 0;
      purchases.forEach(p => {
        if (p.status === "issued" || p.status === "unpaid") pendingPurchases += parseFloat(String(p.totalAmount || 0));
      });

      return `[ДИНАМИЧЕН ФАРМ КОНТЕКСТ ЗА ВИКТОРИЯ]:
- Банкови салда: ${totalBgn.toFixed(2)} BGN / ${totalEur.toFixed(2)} EUR (Важна бележка: напомняй при сметки, че в България от тази година официална разплащателна единица е Евро EUR, заедно с BGN).
- Чакащи вземания от клиенти (фактури): ${pendingSales.toFixed(2)} лв.
- Задължения към доставчици (покупки): ${pendingPurchases.toFixed(2)} лв.
- Брой активни служители и персонал (ТРЗ): ${emps.length} човека.
Използвай тези реални финансови параметри за анализи, бюджетиране и прогнози на паричните потоци на стопанството!`;
    }

    if (personaId === "elena") {
      // Legal & Subsidies Specialist Elena: Contracts, Subsidies, Insurance
      const tenantContracts = await db.select().from(contracts).where(eq(contracts.tenantId, tenantId));
      const tenantSubsidies = await db.select().from(subsidyApplications).where(eq(subsidyApplications.tenantId, tenantId));
      const policies = await db.select().from(insurancePolicies).where(eq(insurancePolicies.tenantId, tenantId));

      let totalContractArea = 0;
      tenantContracts.forEach(c => {
        const da = Number((c.filledData as Record<string, unknown> | null)?.areaDecares || 0);
        if (Number.isFinite(da)) totalContractArea += da;
      });

      const subsidySummary = tenantSubsidies.slice(0, 5)
        .map(s => `${s.applicationNumber || "Заявление"} (${s.status}, очаквани: ${Number(s.amountExpected || 0).toFixed(2)} лв)`)
        .join("; ");

      const insuranceSummary = policies.slice(0, 4)
        .map(p => `Полица №${p.policyNumber} (${p.insurerName}) - до ${p.endDate ? new Date(p.endDate).toLocaleDateString("bg-BG") : "—"}`)
        .join("; ");

      return `[ДИНАМИЧЕН ФАРМ КОНТЕКСТ ЗА ЕЛЕНА]:
- Договори за аренда/наем на земя: ${tenantContracts.length} бр с обща площ ${totalContractArea.toFixed(1)} дка.
- Заявени схеми за субсидиране пред ДФЗ (${tenantSubsidies.length} бр): ${subsidySummary || "Няма въведени схеми"}.
- Активни застрахователни полици (${policies.length} бр): ${insuranceSummary || "Няма въведени полици"}.
Използвай тези реални правно-административни данни при консултации относно договори, срокове пред ДФЗ, проверки на БАБХ и застрахователни събития!`;
    }

    return "";
  } catch (err) {
    console.error("getFarmContextForPersona error:", err);
    return "";
  }
}
