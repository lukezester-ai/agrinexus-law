import { getDb } from '@/lib/db/db';
import { fields } from '@/lib/db/schema/fields';
import { harvestRecords } from '@/lib/db/schema/harvest';
import { inventoryMovements, inventoryItems } from '@/lib/db/schema/inventory';
import { eq, and, gte, lte } from 'drizzle-orm';

export type CostAnalysisRow = {
  fieldId: string;
  fieldName: string;
  areaDecares: number;
  crop: string | null;
  totalYield: number;
  yieldUnit: string;
  seedCost: number;
  fertilizerCost: number;
  chemicalCost: number;
  fuelCost: number;
  servicesCost: number;
  otherCost: number;
  totalCost: number;
  costPerDecare: number;
  costPerUnit: number;
};

export type CostSummary = {
  totalCost: number;
  totalYield: number;
  weightedCostPerDecare: number;
  weightedCostPerUnit: number;
  totalAreaDecares: number;
  cropBreakdown: { crop: string; area: number; yield: number; cost: number }[];
};

function buildDateFilter(start?: string, end?: string) {
  if (!start || !end) return undefined;
  return { start: new Date(start), end: new Date(end) };
}

export async function getCostAnalysis(tenantId: string, seasonStart?: string, seasonEnd?: string): Promise<CostAnalysisRow[]> {
  const { db } = getDb();

  const fieldList = await db.select().from(fields).where(eq(fields.tenantId, tenantId));
  if (fieldList.length === 0) return [];

  const dateRange = buildDateFilter(seasonStart, seasonEnd);

  const harvests = await db
    .select()
    .from(harvestRecords)
    .where(
      and(
        eq(harvestRecords.tenantId, tenantId),
        dateRange ? gte(harvestRecords.date, dateRange.start) : undefined,
        dateRange ? lte(harvestRecords.date, dateRange.end) : undefined,
      )
    );

  const movements = await db
    .select({
      fieldId: inventoryMovements.fieldId,
      type: inventoryMovements.type,
      unitCost: inventoryMovements.unitCost,
      totalCost: inventoryMovements.totalCost,
      itemCategory: inventoryItems.category,
      movementDate: inventoryMovements.movementDate,
    })
    .from(inventoryMovements)
    .leftJoin(inventoryItems, eq(inventoryMovements.itemId, inventoryItems.id))
    .where(
      and(
        eq(inventoryMovements.tenantId, tenantId),
        dateRange ? gte(inventoryMovements.movementDate, dateRange.start) : undefined,
        dateRange ? lte(inventoryMovements.movementDate, dateRange.end) : undefined,
      )
    );

  const harvestByField: Record<string, { yield: number; unit: string; count: number }> = {};
  for (const h of harvests) {
    if (!h.fieldId) continue;
    if (!harvestByField[h.fieldId]) harvestByField[h.fieldId] = { yield: 0, unit: h.yieldUnit, count: 0 };
    harvestByField[h.fieldId].yield += Number(h.yieldAmount);
    harvestByField[h.fieldId].count++;
  }

  const costsByField: Record<string, { seed: number; fertilizer: number; chemical: number; fuel: number; services: number; other: number }> = {};
  for (const m of movements) {
    if (!m.fieldId) continue;
    if (!costsByField[m.fieldId]) costsByField[m.fieldId] = { seed: 0, fertilizer: 0, chemical: 0, fuel: 0, services: 0, other: 0 };
    const cost = m.totalCost ? Number(m.totalCost) : (m.unitCost ? Number(m.unitCost) : 0);
    const cat = (m.itemCategory || m.type || '').toLowerCase();
    if (cat.includes('семе') || cat.includes('seed') || m.type === 'seed') costsByField[m.fieldId].seed += cost;
    else if (cat.includes('тор') || cat.includes('fertilizer') || m.type === 'fertilizer') costsByField[m.fieldId].fertilizer += cost;
    else if (cat.includes('прз') || cat.includes('chemical') || cat.includes('химикат') || cat.includes('препарат') || m.type === 'chemical') costsByField[m.fieldId].chemical += cost;
    else if (cat.includes('гориво') || cat.includes('fuel') || m.type === 'fuel') costsByField[m.fieldId].fuel += cost;
    else if (cat.includes('сервиз') || cat.includes('service') || m.type === 'service') costsByField[m.fieldId].services += cost;
    else costsByField[m.fieldId].other += cost;
  }

  const rows: CostAnalysisRow[] = [];
  for (const field of fieldList) {
    const harvest = harvestByField[field.id];
    const costs = costsByField[field.id] || { seed: 0, fertilizer: 0, chemical: 0, fuel: 0, services: 0, other: 0 };
    const totalCost = costs.seed + costs.fertilizer + costs.chemical + costs.fuel + costs.services + costs.other;
    const area = Number(field.areaDecares);
    const totalYield = harvest?.yield || 0;

    rows.push({
      fieldId: field.id,
      fieldName: field.name,
      areaDecares: area,
      crop: field.crop,
      totalYield,
      yieldUnit: harvest?.unit || 'kg',
      seedCost: costs.seed,
      fertilizerCost: costs.fertilizer,
      chemicalCost: costs.chemical,
      fuelCost: costs.fuel,
      servicesCost: costs.services,
      otherCost: costs.other,
      totalCost,
      costPerDecare: area > 0 ? totalCost / area : 0,
      costPerUnit: totalYield > 0 ? totalCost / totalYield : 0,
    });
  }

  return rows.sort((a, b) => b.totalCost - a.totalCost);
}

export function computeSummary(rows: CostAnalysisRow[]): CostSummary {
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);
  const totalYield = rows.reduce((s, r) => s + r.totalYield, 0);
  const totalArea = rows.reduce((s, r) => s + r.areaDecares, 0);

  const cropMap: Record<string, { area: number; yield: number; cost: number }> = {};
  for (const r of rows) {
    const crop = r.crop || 'Без култура';
    if (!cropMap[crop]) cropMap[crop] = { area: 0, yield: 0, cost: 0 };
    cropMap[crop].area += r.areaDecares;
    cropMap[crop].yield += r.totalYield;
    cropMap[crop].cost += r.totalCost;
  }

  return {
    totalCost,
    totalYield,
    weightedCostPerDecare: totalArea > 0 ? totalCost / totalArea : 0,
    weightedCostPerUnit: totalYield > 0 ? totalCost / totalYield : 0,
    totalAreaDecares: totalArea,
    cropBreakdown: Object.entries(cropMap).map(([crop, data]) => ({ crop, ...data })),
  };
}
