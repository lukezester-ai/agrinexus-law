import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { inventoryItems, inventoryMovements } from '@/lib/db/schema/inventory';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const movs = await db.execute(sql`
      SELECT im.*, ii.name as item_name, ii.unit_of_measure
      FROM inventory_movements im
      LEFT JOIN inventory_items ii ON ii.id = im.item_id
      WHERE im.tenant_id = ${tenantId}
      ORDER BY im.movement_date DESC
      LIMIT 500
    `);
    const rows = (movs as any).rows || [];
    return NextResponse.json(rows.map((r: any) => ({
      ...r, quantity: Number(r.quantity), unitCost: r.unitCost ? Number(r.unitCost) : null,
      totalCost: r.totalCost ? Number(r.totalCost) : null,
    })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();

    const qty = Number(body.quantity);
    const type = body.type; // 'in' or 'out'
    const itemId = body.itemId;

    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).limit(1);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const currentStock = Number(item.currentStock);
    const newStock = type === 'in' ? currentStock + qty : currentStock - qty;
    if (newStock < 0) return NextResponse.json({ error: 'Недостатъчна наличност' }, { status: 400 });

    const [mov] = await db.insert(inventoryMovements).values({
      tenantId, itemId, type,
      quantity: String(qty),
      unitCost: body.unitCost !== undefined ? String(body.unitCost) : null,
      totalCost: body.totalCost !== undefined ? String(body.totalCost) : null,
      movementDate: body.movementDate ? new Date(body.movementDate) : new Date(),
      description: body.description || null,
      referenceType: body.referenceType || null,
      referenceId: body.referenceId || null,
    }).returning();

    await db.update(inventoryItems).set({ currentStock: String(newStock) }).where(eq(inventoryItems.id, itemId));

    return NextResponse.json({ movement: mov, newStock }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
