import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { getCostAnalysis, computeSummary } from '@/lib/farm/cost-analysis';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const seasonStart = searchParams.get('season_start') || undefined;
    const seasonEnd = searchParams.get('season_end') || undefined;

    const rows = await getCostAnalysis(tenantId, seasonStart, seasonEnd);
    const summary = computeSummary(rows);

    return NextResponse.json({ rows, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
