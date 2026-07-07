import { getDb } from "@/lib/db/db";
import { inventoryItems, inventoryMovements } from "@/lib/db/schema/inventory";
import { crops } from "@/lib/db/schema/fields";
import { eq } from "drizzle-orm";

export async function createInventoryFromHarvest(params: {
  tenantId: string;
  cropId: string | null;
  yieldAmount: number;
  yieldUnit: string;
  fieldName?: string | null;
  date: Date;
}) {
  const { tenantId, cropId, yieldAmount, yieldUnit, fieldName, date } = params;
  const { db } = getDb();

  let itemName = fieldName || "Реколта";
  let category = "crop";

  if (cropId) {
    const [crop] = await db.select({ name: crops.name, category: crops.category }).from(crops).where(eq(crops.id, cropId)).limit(1);
    if (crop) {
      itemName = crop.name;
      category = crop.category === "vegetable" ? "vegetable" : "crop";
    }
  }

  let [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.name, itemName)).limit(1);
  if (!item) {
    const [newItem] = await db.insert(inventoryItems).values({
      tenantId, name: itemName, unitOfMeasure: yieldUnit,
      category, currentStock: "0", isActive: true,
    }).returning();
    item = newItem;
  }

  const qty = Number(yieldAmount);
  const currentStock = Number(item.currentStock);
  const newStock = currentStock + qty;

  await db.insert(inventoryMovements).values({
    tenantId, itemId: item.id, type: "in",
    quantity: String(qty), movementDate: date,
    referenceType: "harvest", referenceId: null,
    description: `Реколта: ${itemName}${fieldName ? `, полe ${fieldName}` : ""}`,
  });

  await db.update(inventoryItems).set({ currentStock: String(newStock) }).where(eq(inventoryItems.id, item.id));

  return item.id;
}
