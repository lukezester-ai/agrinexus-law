import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { productCodes } from '@/lib/db/schema/product_codes';
import { inventoryItems } from '@/lib/db/schema/inventory';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const { db } = getDb();

    const where = itemId
      ? and(eq(productCodes.tenantId, tenantId), eq(productCodes.itemId, itemId))
      : eq(productCodes.tenantId, tenantId);

    const result = await db
      .select({
        id: productCodes.id,
        tenantId: productCodes.tenantId,
        itemId: productCodes.itemId,
        code: productCodes.code,
        codeType: productCodes.codeType,
        isPrimary: productCodes.isPrimary,
        createdAt: productCodes.createdAt,
        itemName: inventoryItems.name,
      })
      .from(productCodes)
      .leftJoin(inventoryItems, eq(productCodes.itemId, inventoryItems.id))
      .where(where)
      .orderBy(desc(productCodes.createdAt));

    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { db } = getDb();
    const [result] = await db.insert(productCodes).values({
      tenantId,
      itemId: body.itemId,
      code: body.code,
      codeType: body.codeType || 'ean',
      isPrimary: body.isPrimary || 'false',
    }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { db } = getDb();
    await db.delete(productCodes).where(eq(productCodes.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
