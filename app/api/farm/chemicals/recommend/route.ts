import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { chemicalProducts } from '@/lib/db/schema/chemical_diary';
import { inventoryItems } from '@/lib/db/schema/inventory';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { crop = 'Пшеница', pestOrDisease = 'Житна пиявица', areaDecares = 100 } = body;

    const { db } = getDb();
    const [products, inventory] = await Promise.all([
      db.select().from(chemicalProducts).where(eq(chemicalProducts.tenantId, tenantId)),
      db.select().from(inventoryItems).where(eq(inventoryItems.tenantId, tenantId)),
    ]);

    // Build standard Bulgarian agronomist expert knowledge base for common pests/diseases if not in custom products
    const recommendations = [];

    const lowerPest = pestOrDisease.toLowerCase();
    const lowerCrop = crop.toLowerCase();

    if (lowerPest.includes('пиявица') || lowerPest.includes('въшка') || lowerPest.includes('насеко') || lowerPest.includes('нощенка')) {
      recommendations.push({
        productName: 'Децис 100 ЕК (Инсектицид)',
        productType: 'insecticide',
        activeSubstance: 'Делтамиетрин 100 г/л',
        dosePerDa: 0.015,
        doseUnit: 'l/da',
        totalNeeded: Number((0.015 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Високоефективен пиретроиден инсектицид със силен бърз (knock-down) ефект срещу ${pestOrDisease} при ${crop}. Карантинен срок: 7 дни. Приложете във вечерните часове при температура под 25°C.`,
      });
      recommendations.push({
        productName: 'Нурел Д / Хлорипирифос (Инсектицид)',
        productType: 'insecticide',
        activeSubstance: 'Хлорпирифос + Циперметрин',
        dosePerDa: 0.05,
        doseUnit: 'l/da',
        totalNeeded: Number((0.05 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Системно-контактно действие за справяне с масова инвазия на ${pestOrDisease}. Осигурява до 14 дни продължителна защита на посева.`,
      });
    } else if (lowerPest.includes('септориоза') || lowerPest.includes('ръжда') || lowerPest.includes('мана') || lowerPest.includes('фузариоза') || lowerPest.includes('болест')) {
      recommendations.push({
        productName: 'Фунгицид Амистар Екстра',
        productType: 'fungicide',
        activeSubstance: 'Азоксистробин + Ципроконазол',
        dosePerDa: 0.08,
        doseUnit: 'l/da',
        totalNeeded: Number((0.08 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Отличен системен фунгицид с превантивно и лечебно действие срещу ${pestOrDisease} по ${crop}. Удължава зеления ефект (greening effect) на флаговия лист и повишава добива.`,
      });
      recommendations.push({
        productName: 'Фолкур 250 ЕВ (Фунгицид)',
        productType: 'fungicide',
        activeSubstance: 'Тебуконазол 250 г/л',
        dosePerDa: 0.10,
        doseUnit: 'l/da',
        totalNeeded: Number((0.10 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Широкоспектърен триазолов фунгицид за надежден контрол на гъбни патогени и фузариоза по класа. Карантинен срок: 35 дни.`,
      });
    } else if (lowerPest.includes('плев') || lowerPest.includes('овес') || lowerPest.includes('щир') || lowerPest.includes('паламида')) {
      recommendations.push({
        productName: 'Хербицид Пума Супер 7.5 ЕВ',
        productType: 'herbicide',
        activeSubstance: 'Феноксапроп-П-етил',
        dosePerDa: 0.10,
        doseUnit: 'l/da',
        totalNeeded: Number((0.10 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Селективен вегетационен хербицид за борба срещу едногодишни житни плевели (${pestOrDisease}) в житни култури. Висока селективност за културното растение.`,
      });
      recommendations.push({
        productName: 'Гранстар Супер 50 СГ (Хербицид)',
        productType: 'herbicide',
        activeSubstance: 'Трибенурон-метил + Тиифенсулфурон-метил',
        dosePerDa: 0.004,
        doseUnit: 'kg/da',
        totalNeeded: Number((0.004 * Number(areaDecares)).toFixed(3)),
        unitOfMeasure: 'кг',
        agronomistRationale: `Системен сулфонилурейен хербицид за пълен контрол на широколистни плевели при ${crop}. Прилага се в комбинация с прилепител Тренд 90.`,
      });
    } else {
      // General broad spectrum suggestion
      recommendations.push({
        productName: 'Фунгицид Амистар Екстра',
        productType: 'fungicide',
        activeSubstance: 'Азоксистробин',
        dosePerDa: 0.08,
        doseUnit: 'l/da',
        totalNeeded: Number((0.08 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Комплексна защита за ${crop} срещу гъбни патогени (${pestOrDisease}). Подобрява физиологичното състояние и устойчивостта на стрес.`,
      });
      recommendations.push({
        productName: 'Листен тор Аминобест (Стимулатор)',
        productType: 'fertilizer',
        activeSubstance: 'Аминокиселини и микроелементи',
        dosePerDa: 0.15,
        doseUnit: 'l/da',
        totalNeeded: Number((0.15 * Number(areaDecares)).toFixed(2)),
        unitOfMeasure: 'л',
        agronomistRationale: `Биостимулатор за преодоляване на хербициден или климатичен стрес при ${crop} и подпомагане на борбата срещу ${pestOrDisease}.`,
      });
    }

    // Match each recommended item against actual warehouse inventory in `inventoryItems` or `chemicalProducts`
    const enrichedRecommendations = recommendations.map(rec => {
      // Find matching inventory item by name or active substance
      const matchedInv = inventory.find(i => 
        i.name.toLowerCase().includes(rec.productName.split(' ')[0].toLowerCase()) ||
        rec.productName.toLowerCase().includes(i.name.toLowerCase())
      );
      const matchedProd = products.find(p => 
        p.name.toLowerCase().includes(rec.productName.split(' ')[0].toLowerCase()) ||
        rec.productName.toLowerCase().includes(p.name.toLowerCase())
      );

      const stock = matchedInv ? Number(matchedInv.currentStock || 0) : 0;
      const invItemId = matchedInv ? matchedInv.id : null;
      const prodId = matchedProd ? matchedProd.id : null;

      return {
        ...rec,
        inventoryItemId: invItemId,
        productId: prodId,
        availableStock: stock,
        stockUnit: matchedInv?.unitOfMeasure || rec.unitOfMeasure,
        hasSufficientStock: stock >= rec.totalNeeded,
      };
    });

    return NextResponse.json({
      crop,
      pestOrDisease,
      areaDecares,
      recommendations: enrichedRecommendations,
      aiAdviceSummary: `Агроном Борис: За масив от ${areaDecares} дка с култура ${crop} и проблем "${pestOrDisease}", препоръчвам незабавна интервенция при подходящи метеорологични условия (вятър до 3 м/с и липса на валежи в следващите 4 часа). При избор на препарат, системата автоматично проверява наличностите в Склад и изписва точната доза.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
