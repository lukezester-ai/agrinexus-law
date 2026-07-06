import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { inventoryItems } from '@/lib/db/schema/inventory';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.tenantId, tenantId)).orderBy(desc(inventoryItems.createdAt));
    return NextResponse.json(result.map((i: any) => ({ ...i, currentStock: Number(i.currentStock), minStock: i.minStock ? Number(i.minStock) : null })));
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(inventoryItems).values({
      tenantId, name: body.name, sku: body.sku || null, unitOfMeasure: body.unitOfMeasure || 'br',
      category: body.category || null, minStock: body.minStock !== undefined ? String(body.minStock) : null,
      currentStock: String(body.currentStock ?? 0), isActive: true,
    }).returning();
    return NextResponse.json({ ...result, currentStock: Number(result.currentStock), minStock: result.minStock ? Number(result.minStock) : null }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { db } = getDb();
    await db.update(inventoryItems).set({
      name: body.name, sku: body.sku, unitOfMeasure: body.unitOfMeasure, category: body.category,
      minStock: body.minStock !== undefined ? String(body.minStock) : null,
      currentStock: String(body.currentStock ?? 0),
    }).where(eq(inventoryItems.id, body.id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
