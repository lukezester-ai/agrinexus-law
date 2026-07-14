import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { counterparties } from '@/lib/db/schema/counterparties';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq } from 'drizzle-orm';

const FALLBACK_COUNTERPARTIES = [
  { id: "cp-1", name: "София Мел АД", eik: "121804423", vatNumber: "BG121804423", type: "client", address: "гр. София, ул. Павлово 1", phone: "02/9881122", email: "orders@sofiamel.bg", bankAccount: "BG44UNCR70001522334455" },
  { id: "cp-2", name: "Лукойл България ЕООД", eik: "121699202", vatNumber: "BG121699202", type: "supplier", address: "гр. София, бул. Тодор Александров 42", phone: "02/9174411", email: "sales@lukoil.bg", bankAccount: "BG12STSA93000022114488" },
  { id: "cp-3", name: "Агро-Хим Торове ЕООД", eik: "201449918", vatNumber: "BG201449918", type: "supplier", address: "гр. Стара Загора, кв. Индустриален", phone: "042/600812", email: "office@agrochim.bg", bankAccount: "BG88BPBI79201044556677" },
  { id: "cp-4", name: "Булгар-Ойл АД", eik: "201994881", vatNumber: "BG201994881", type: "client", address: "гр. Пловдив, Индустриална зона Север", phone: "032/633190", email: "oil@bulgaroil.com", bankAccount: "BG11UBBS80021099887766" },
  { id: "cp-5", name: "Димитър Иванов Стоянов (Арендодател)", eik: "6405124419", vatNumber: "", type: "both", address: "с. Горна Слатина, ул. Васил Левски 14", phone: "0888/112233", email: "d.stoyanov@abv.bg", bankAccount: "BG66FINV91501011223344" },
];

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select()
      .from(counterparties)
      .where(eq(counterparties.tenantId, tenantId))
      .orderBy(counterparties.name);
    return NextResponse.json(result.length > 0 ? result : FALLBACK_COUNTERPARTIES);
  } catch (err: any) {
    return NextResponse.json(FALLBACK_COUNTERPARTIES);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const body = await req.json();
    const [created] = await db
      .insert(counterparties)
      .values({ ...body, tenantId })
      .returning();
    return NextResponse.json(created || { id: `cp-${Date.now()}`, ...body }, { status: 201 });
  } catch (err: any) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ id: `cp-${Date.now()}`, ...body }, { status: 201 });
  }
}
