import { getDb } from "@/lib/db/db";
import { inventoryItems, inventoryMovements } from "@/lib/db/schema/inventory";
import { eq, desc } from "drizzle-orm";

type InvoiceLine = { id: string; name: string; quantity: number; unitPrice: number; vatRate: number };

export async function updateInventoryFromInvoice(params: {
  tenantId: string;
  type: "sales" | "purchase";
  items: InvoiceLine[];
  date: Date;
  invoiceNumber: string;
}) {
  const { tenantId, type, items, date, invoiceNumber } = params;
  const { db } = getDb();
  const dir = type === "sales" ? "out" : "in";

  for (const item of items) {
    if (!item.name || item.quantity <= 0) continue;

    let [invItem] = await db.select().from(inventoryItems)
      .where(eq(inventoryItems.name, item.name))
      .limit(1);

    if (!invItem) {
      const [newItem] = await db.insert(inventoryItems).values({
        tenantId, name: item.name, unitOfMeasure: "br",
        category: "trade", currentStock: "0", isActive: true,
      }).returning();
      invItem = newItem;
    }

    if (dir === "out") {
      const current = Number(invItem.currentStock);
      if (current < item.quantity) continue;
    }

    const currentStock = Number(invItem.currentStock);
    const newStock = dir === "in" ? currentStock + item.quantity : currentStock - item.quantity;

    await db.insert(inventoryMovements).values({
      tenantId, itemId: invItem.id, type: dir,
      quantity: String(item.quantity),
      movementDate: date,
      referenceType: "invoice",
      referenceId: invoiceNumber,
      description: `${type === "sales" ? "Продажба" : "Покупка"}: ${invoiceNumber} - ${item.name}`,
    });

    await db.update(inventoryItems).set({ currentStock: String(newStock) })
      .where(eq(inventoryItems.id, invItem.id));
  }
}
