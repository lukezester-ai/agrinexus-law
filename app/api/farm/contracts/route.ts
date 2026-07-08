import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { contracts, contractTemplates } from '@/lib/db/schema/contracts';
import { counterparties } from '@/lib/db/schema/counterparties';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and } from 'drizzle-orm';

const CONTRACT_TYPES = ['lease', 'machine_rental', 'sale', 'service', 'other'];
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  lease: 'Аренда', machine_rental: 'Наем на машина', sale: 'Продажба', service: 'Услуга', other: 'Друг',
};

function fillTemplate(content: string, data: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
}

function formatDate(date: Date): string {
  const months = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} г.`;
}

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db
      .select({
        contract: contracts,
        templateName: contractTemplates.name,
        counterpartyName: counterparties.name,
      })
      .from(contracts)
      .leftJoin(contractTemplates, eq(contracts.templateId, contractTemplates.id))
      .leftJoin(counterparties, eq(contracts.counterpartyId, counterparties.id))
      .where(eq(contracts.tenantId, tenantId))
      .orderBy(desc(contracts.issueDate));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();

    const season = String(new Date().getFullYear());
    const count = await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.type, body.type || 'lease')))
      .then((r) => r.length + 1);
    const typePrefix = { lease: 'АР', machine_rental: 'НМ', sale: 'ПП', service: 'УС', other: 'ДГ' };
    const contractNumber = `${typePrefix[body.type as keyof typeof typePrefix] || 'ДГ'}-${season}-${String(count).padStart(4, '0')}`;

    let counterpartyData: Record<string, string> = {};
    if (body.counterpartyId) {
      const [cp] = await db.select().from(counterparties).where(eq(counterparties.id, body.counterpartyId)).limit(1);
      if (cp) {
        counterpartyData = {
          clientName: cp.name, clientEik: cp.eik || '', clientAddress: cp.address || '',
          clientCity: cp.city || '', clientEmail: cp.email || '', clientPhone: cp.phone || '',
          clientContact: cp.contactPerson || '',
        };
      }
    }

    let templateContent = body.content || '';
    if (body.templateId) {
      const [tpl] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, body.templateId)).limit(1);
      if (tpl) templateContent = tpl.content;
    }

    const now = new Date();
    const filledData = { ...body.filledData, ...counterpartyData };
    const contextData: Record<string, string> = {
      contractNumber, date: formatDate(now), year: String(now.getFullYear()),
      ...filledData,
    };
    if (body.expiryDate) {
      contextData.expiryDate = formatDate(new Date(body.expiryDate));
    }

    const filledContent = fillTemplate(templateContent, contextData);

    const [result] = await db.insert(contracts).values({
      tenantId, templateId: body.templateId || null,
      counterpartyId: body.counterpartyId || null,
      contractNumber, type: body.type || 'lease',
      status: body.status || 'draft',
      issueDate: now, expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      content: filledContent, filledData: contextData,
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
