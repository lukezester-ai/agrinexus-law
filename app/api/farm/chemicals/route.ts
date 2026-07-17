import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { chemicalProducts, chemicalApplications } from '@/lib/db/schema/chemical_diary';
import { inventoryItems, inventoryMovements } from '@/lib/db/schema/inventory';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const [allProducts, allApps] = await Promise.all([
      db.select().from(chemicalProducts).where(eq(chemicalProducts.tenantId, tenantId)).orderBy(chemicalProducts.name),
      db.execute(sql`
        SELECT ca.*, cp.name as product_name, f.name as field_name
        FROM chemical_applications ca
        LEFT JOIN chemical_products cp ON cp.id = ca.product_id
        LEFT JOIN fields f ON f.id = ca.field_id
        WHERE ca.tenant_id = ${tenantId}
        ORDER BY ca.application_date DESC
      `),
    ]);
    return NextResponse.json({ products: allProducts, applications: (allApps as any).rows.map((r: any) => ({ ...r, doseAmount: Number(r.dose_amount), totalAmount: Number(r.total_amount) })) });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();

    if (body._type === 'product') {
      const [result] = await db.insert(chemicalProducts).values({
        tenantId, name: body.name, productType: body.productType || 'other',
        inventoryItemId: body.inventoryItemId || null,
        activeSubstance: body.activeSubstance || null, concentration: body.concentration || null,
        unitOfMeasure: body.unitOfMeasure || 'l', manufacturer: body.manufacturer || null,
        permitNumber: body.permitNumber || null, hazardClass: body.hazardClass || null,
      }).returning();
      return NextResponse.json(result, { status: 201 });
    }

    if (body._type === 'application') {
      const [result] = await db.insert(chemicalApplications).values({
        tenantId, fieldId: body.fieldId, applicationDate: body.applicationDate ? new Date(body.applicationDate) : new Date(),
        productId: body.productId, doseAmount: String(body.doseAmount), doseUnit: body.doseUnit || 'l/da',
        totalAmount: String(body.totalAmount), totalUnit: body.totalUnit || 'l',
        crop: body.crop || null, pestTarget: body.pestTarget || null,
        applicationMethod: body.applicationMethod || null, operatorName: body.operatorName || null,
        notes: body.notes || null, isCompleted: 'true',
      }).returning();

      // Ticket 1 (P0): Auto-deduct inventory & check negative stock warning
      let hasInventoryWarning = false;
      let warningMessage: string | null = null;
      try {
        const [product] = await db.select().from(chemicalProducts).where(eq(chemicalProducts.id, body.productId));
        if (product) {
          let invItem = null;
          if (product.inventoryItemId) {
            [invItem] = await db.select().from(inventoryItems).where(and(eq(inventoryItems.id, product.inventoryItemId), eq(inventoryItems.tenantId, tenantId)));
          }
          if (!invItem) {
            [invItem] = await db.select().from(inventoryItems).where(and(eq(inventoryItems.tenantId, tenantId), sql`LOWER(${inventoryItems.name}) = LOWER(${product.name})`));
          }

          const deductedQty = Number(body.totalAmount) || 0;
          if (invItem && deductedQty > 0) {
            const currentStockNum = Number(invItem.currentStock || 0);
            const newStock = currentStockNum - deductedQty;

            await db.insert(inventoryMovements).values({
              tenantId,
              itemId: invItem.id,
              fieldId: body.fieldId || null,
              type: 'chemical_application',
              quantity: String(-deductedQty),
              unitCost: String(0),
              totalCost: String(0),
              movementDate: new Date(),
              referenceId: result.id,
              referenceType: 'chemical_application',
              description: `Изписване за приложение на ${product.name} (Доза: ${body.doseAmount} ${body.doseUnit || 'l/da'})`,
            });

            await db.update(inventoryItems)
              .set({ currentStock: String(newStock), updatedAt: new Date() })
              .where(eq(inventoryItems.id, invItem.id));

            if (newStock < 0) {
              hasInventoryWarning = true;
              warningMessage = `⚠️ Внимание: Наличността в Склад за препарат "${product.name}" стана отрицателна (${newStock.toFixed(2)} ${invItem.unitOfMeasure || 'л'}). Моля заведете приходна фактура или начално салдо в модул Склад!`;
            }
          }
        }
      } catch (invErr) {
        console.error('Inventory auto-deduction check failed:', invErr);
      }

      return NextResponse.json({ ...result, hasInventoryWarning, warningMessage }, { status: 201 });
    }

    return NextResponse.json({ error: '_type required: product or application' }, { status: 400 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(chemicalApplications).where(eq(chemicalApplications.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
