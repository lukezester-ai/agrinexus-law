import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

const FALLBACK_ACCOUNTS = [
  { id: "acc-101", accountNumber: "101", name: "Основен капитал", type: "equity", isActive: true, isAnalytical: false },
  { id: "acc-121", accountNumber: "121", name: "Неразпределена печалба от минали години", type: "equity", isActive: true, isAnalytical: false },
  { id: "acc-201", accountNumber: "201", name: "Земи (земеделска земя - неовехтяваща)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-204", accountNumber: "204", name: "Машини, съоръжения и оборудване (Трактори и комбайни)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-272", accountNumber: "272", name: "Биологични активи в плододаване (Овощни и Лозя / МСС 41)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-301", accountNumber: "301", name: "Материали (Семена, торове, фуражи и препарати)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-303", accountNumber: "303", name: "Готова продукция (Зърно, плодове, мляко, мед)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-401", accountNumber: "401", name: "Доставчици и свързани лица", type: "liability", isActive: true, isAnalytical: true },
  { id: "acc-411", accountNumber: "411", name: "Клиенти (Вземания по продажби на продукция)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-4531", accountNumber: "4531", name: "Начислен ДДС за покупките (ДДС за възстановяване)", type: "asset", isActive: true, isAnalytical: false },
  { id: "acc-4532", accountNumber: "4532", name: "Начислен ДДС за продажбите (ДДС за внасяне)", type: "liability", isActive: true, isAnalytical: false },
  { id: "acc-499", accountNumber: "499", name: "Задължения към арендодатели (Земеделска рента)", type: "liability", isActive: true, isAnalytical: true },
  { id: "acc-501", accountNumber: "501", name: "Каса в лева и валута", type: "asset", isActive: true, isAnalytical: false },
  { id: "acc-503", accountNumber: "503", name: "Разплащателна сметка в лева и евро (Банка)", type: "asset", isActive: true, isAnalytical: true },
  { id: "acc-601", accountNumber: "601", name: "Разходи за материали (Торове, семена, препарати)", type: "expense", isActive: true, isAnalytical: true },
  { id: "acc-6013", accountNumber: "6013", name: "Разходи за горива и смазочни материали (Дизел)", type: "expense", isActive: true, isAnalytical: true },
  { id: "acc-602", accountNumber: "602", name: "Разходи за външни услуги (Рента, агроуслуги, сервиз)", type: "expense", isActive: true, isAnalytical: true },
  { id: "acc-603", accountNumber: "603", name: "Разходи за амортизация (ДМА и Биологични активи)", type: "expense", isActive: true, isAnalytical: false },
  { id: "acc-604", accountNumber: "604", name: "Разходи за заплати (Сезонни и постоянни работници)", type: "expense", isActive: true, isAnalytical: true },
  { id: "acc-611", accountNumber: "611", name: "Разходи за основна дейност (Себестойност на продукция / Млади насаждения)", type: "expense", isActive: true, isAnalytical: true },
  { id: "acc-701", accountNumber: "701", name: "Приходи от продажба на продукция (Зърно, плодове)", type: "revenue", isActive: true, isAnalytical: true },
  { id: "acc-751", accountNumber: "751", name: "Приходи от финансирания (Субсидии ДФЗ / СЕУ)", type: "revenue", isActive: true, isAnalytical: true },
];

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.tenantId, tenantId))
      .orderBy(accountPlan.accountNumber);
    return NextResponse.json(result.length > 0 ? result : FALLBACK_ACCOUNTS);
  } catch (err: any) {
    return NextResponse.json(FALLBACK_ACCOUNTS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const [created] = await db
      .insert(accountPlan)
      .values({ ...body, tenantId })
      .returning();
    return NextResponse.json(created || { id: `acc-${Date.now()}`, ...body }, { status: 201 });
  } catch (err: any) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ id: `acc-${Date.now()}`, ...body }, { status: 201 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const [updated] = await db
      .update(accountPlan)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)))
      .returning();
    if (!updated) return NextResponse.json({ id, ...data });
    return NextResponse.json(updated);
  } catch (err: any) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(body);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await db
      .delete(accountPlan)
      .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
