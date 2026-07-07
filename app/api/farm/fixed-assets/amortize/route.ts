import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { fixedAssets } from '@/lib/db/schema/fixed_assets';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';
import { calculateAmortization } from '@/lib/fixed-assets/amortization';

export async function POST() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const assets = await db.select().from(fixedAssets).where(and(eq(fixedAssets.tenantId, tenantId), eq(fixedAssets.isActive, 'true')));

    const results: Array<{ id: string; name: string; monthlyAmount: number; newAccumulated: number; bookValue: number }> = [];

    for (const asset of assets) {
      const acquisitionCost = Number(asset.acquisitionCost);
      const salvageValue = Number(asset.salvageValue);
      const usefulLifeMonths = Number(asset.usefulLifeMonths);
      const accumulatedAmortization = Number(asset.accumulatedAmortization);

      const { monthlyAmount, newAccumulated, bookValue } = calculateAmortization({
        acquisitionCost,
        salvageValue,
        usefulLifeMonths,
        accumulatedAmortization,
      });

      await db.update(fixedAssets).set({
        accumulatedAmortization: String(newAccumulated),
        bookValue: String(bookValue),
      }).where(eq(fixedAssets.id, asset.id));

      results.push({ id: asset.id, name: asset.name, monthlyAmount, newAccumulated, bookValue });
    }

    return NextResponse.json({ amortized: results.length, results });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
