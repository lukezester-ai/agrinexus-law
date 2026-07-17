import { getDb } from "@/lib/db/db";
import { cropRotationPlans } from "@/lib/db/schema/crop_rotation";
import { fields, crops } from "@/lib/db/schema/fields";
import { eq, and } from "drizzle-orm";

const ROTATION_RULES: Record<string, string[]> = {
  "Пшеница": ["Рапица", "Слънчоглед", "Бобови", "Царевица", "Ечемик"],
  "Ечемик": ["Рапица", "Слънчоглед", "Бобови", "Царевица"],
  "Царевица": ["Пшеница", "Ечемик", "Бобови", "Слънчоглед"],
  "Слънчоглед": ["Пшеница", "Ечемик", "Царевица", "Бобови"],
  "Рапица": ["Пшеница", "Ечемик", "Бобови"],
  "Бобови": ["Пшеница", "Ечемик", "Царевица", "Слънчоглед", "Рапица"],
};

/**
 * TICKET 4 (P1): Automatically log crop rotation entries and set next season's predecessor when harvest is recorded.
 */
export async function autoLogCropRotationFromHarvest(params: {
  tenantId: string;
  fieldId: string | null;
  cropId: string | null;
  yieldAmount: number;
  yieldUnit: string;
  date: Date;
}) {
  const { tenantId, fieldId, cropId, yieldAmount, yieldUnit, date } = params;
  if (!fieldId) return null;

  const { db } = getDb();
  const year = date.getFullYear();

  // Determine crop name
  let cropName = "Пшеница";
  if (cropId) {
    const [c] = await db.select({ name: crops.name }).from(crops).where(eq(crops.id, cropId)).limit(1);
    if (c?.name) cropName = c.name;
  } else {
    const [f] = await db.select({ crop: fields.crop }).from(fields).where(eq(fields.id, fieldId)).limit(1);
    if (f?.crop) cropName = f.crop;
  }

  // 1. Check or update current year's rotation plan
  const [currentPlan] = await db
    .select()
    .from(cropRotationPlans)
    .where(and(eq(cropRotationPlans.tenantId, tenantId), eq(cropRotationPlans.fieldId, fieldId), eq(cropRotationPlans.year, year)))
    .limit(1);

  if (currentPlan) {
    const updatedNotes = currentPlan.notes
      ? `${currentPlan.notes} | Прибрана реколта: ${yieldAmount} ${yieldUnit}`
      : `Прибрана реколта: ${yieldAmount} ${yieldUnit}`;

    await db
      .update(cropRotationPlans)
      .set({
        status: "completed",
        plannedCrop: cropName,
        notes: updatedNotes,
      })
      .where(eq(cropRotationPlans.id, currentPlan.id));
  } else {
    await db.insert(cropRotationPlans).values({
      tenantId,
      fieldId,
      year,
      plannedCrop: cropName,
      status: "completed",
      notes: `Автоматично записано от прибиране на реколта: ${yieldAmount} ${yieldUnit}`,
    });
  }

  // 2. Set predecessor for next year (year + 1)
  const nextYear = year + 1;
  const [nextPlan] = await db
    .select()
    .from(cropRotationPlans)
    .where(and(eq(cropRotationPlans.tenantId, tenantId), eq(cropRotationPlans.fieldId, fieldId), eq(cropRotationPlans.year, nextYear)))
    .limit(1);

  if (nextPlan) {
    await db
      .update(cropRotationPlans)
      .set({
        previousCrop: cropName,
      })
      .where(eq(cropRotationPlans.id, nextPlan.id));
  } else {
    const recommendedNext = ROTATION_RULES[cropName]?.[0] || "Пшеница";
    await db.insert(cropRotationPlans).values({
      tenantId,
      fieldId,
      year: nextYear,
      plannedCrop: recommendedNext,
      previousCrop: cropName,
      status: "planned",
      notes: `Автоматично предложен предшественик (${cropName}) от реколта ${year} г. Препоръчана култура: ${recommendedNext}`,
    });
  }

  return { loggedYear: year, nextYear, cropName };
}
