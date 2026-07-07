import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { sql } from 'drizzle-orm';

function q(value: any) {
  return { orDefault: (fallback: any) => {
    try { return value?.rows?.[0] || fallback; }
    catch { return fallback; }
  }};
}

function rows(value: any) {
  try { return value?.rows || []; }
  catch { return []; }
}

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();

    const run = (query: any) => db.execute(query).catch(() => null);

    const [
      fieldsResult,
      inventoryResult,
      lowStockResult,
      employeesResult,
      invoicesResult,
      harvestResult,
      machinesResult,
      upcomingResult,
    ] = await Promise.all([
      run(sql`SELECT COUNT(*)::int as total_fields, COALESCE(SUM(area_decares), 0)::numeric(12,2) as total_area FROM fields WHERE tenant_id = ${tenantId}`),
      run(sql`SELECT COUNT(*)::int as total_items, COALESCE(SUM(current_stock::numeric), 0)::numeric(15,3) as total_stock FROM inventory_items WHERE tenant_id = ${tenantId}`),
      run(sql`SELECT COUNT(*)::int as low_stock_count FROM inventory_items WHERE tenant_id = ${tenantId} AND min_stock IS NOT NULL AND current_stock <= min_stock`),
      run(sql`SELECT COUNT(*)::int as active_employees FROM employees WHERE tenant_id = ${tenantId} AND is_active = 'true'`),
      run(sql`SELECT COUNT(*)::int as pending_invoices FROM invoices WHERE tenant_id = ${tenantId} AND status = 'issued'`),
      run(sql`SELECT COALESCE(SUM(yield_amount::numeric), 0)::numeric(15,2) as total_harvest FROM harvest_records WHERE tenant_id = ${tenantId} AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`),
      run(sql`SELECT COUNT(*)::int as total_machines FROM machines WHERE tenant_id = ${tenantId} AND status = 'active'`),
      run(sql`SELECT id, title, due_date::text as date, 'reminder' as type FROM reminders WHERE tenant_id = ${tenantId} AND is_completed = 'false' AND due_date >= CURRENT_DATE ORDER BY due_date ASC LIMIT 5`),
    ]);

    const f = q(fieldsResult).orDefault({});
    const inv = q(inventoryResult).orDefault({});
    const ls = q(lowStockResult).orDefault({});
    const emp = q(employeesResult).orDefault({});
    const invc = q(invoicesResult).orDefault({});
    const har = q(harvestResult).orDefault({});
    const mach = q(machinesResult).orDefault({});

    return NextResponse.json({
      fields: { total: f.total_fields || 0, area: f.total_area || 0 },
      inventory: { totalItems: inv.total_items || 0, totalStock: inv.total_stock || 0, lowStock: ls.low_stock_count || 0 },
      employees: { active: emp.active_employees || 0 },
      invoices: { pending: invc.pending_invoices || 0 },
      harvest: { currentYear: har.total_harvest || 0 },
      machines: { total: mach.total_machines || 0 },
      upcoming: rows(upcomingResult),
    });
  } catch (err: any) {
    return NextResponse.json({
      fields: { total: 0, area: 0 },
      inventory: { totalItems: 0, totalStock: 0, lowStock: 0 },
      employees: { active: 0 },
      invoices: { pending: 0 },
      harvest: { currentYear: 0 },
      machines: { total: 0 },
      upcoming: [],
    });
  }
}
