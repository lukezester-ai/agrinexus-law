import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();

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
      db.execute(sql`
        SELECT COUNT(*)::int as total_fields, COALESCE(SUM(area_decares), 0)::numeric(12,2) as total_area
        FROM fields WHERE tenant_id = ${tenantId}
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as total_items, COALESCE(SUM(current_stock::numeric), 0)::numeric(15,3) as total_stock
        FROM inventory_items WHERE tenant_id = ${tenantId}
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as low_stock_count
        FROM inventory_items WHERE tenant_id = ${tenantId} AND min_stock IS NOT NULL AND current_stock <= min_stock
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as active_employees
        FROM employees WHERE tenant_id = ${tenantId} AND is_active = 'true'
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as pending_invoices
        FROM invoices WHERE tenant_id = ${tenantId} AND status = 'issued'
      `),
      db.execute(sql`
        SELECT COALESCE(SUM(yield_amount::numeric), 0)::numeric(15,2) as total_harvest
        FROM harvest_records WHERE tenant_id = ${tenantId}
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as total_machines
        FROM machines WHERE tenant_id = ${tenantId} AND status = 'active'
      `),
      db.execute(sql`
        SELECT id, title, due_date::text as date, 'reminder' as type
        FROM reminders
        WHERE tenant_id = ${tenantId} AND is_completed = 'false' AND due_date >= CURRENT_DATE
        ORDER BY due_date ASC LIMIT 5
      `),
    ]);

    const fields = (fieldsResult as any).rows[0] || {};
    const inventory = (inventoryResult as any).rows[0] || {};
    const lowStock = (lowStockResult as any).rows[0] || {};
    const employees = (employeesResult as any).rows[0] || {};
    const invoices = (invoicesResult as any).rows[0] || {};
    const harvest = (harvestResult as any).rows[0] || {};
    const machines = (machinesResult as any).rows[0] || {};
    const upcoming = (upcomingResult as any).rows || [];

    return NextResponse.json({
      fields: { total: fields.total_fields || 0, area: fields.total_area || 0 },
      inventory: { totalItems: inventory.total_items || 0, totalStock: inventory.total_stock || 0, lowStock: lowStock.low_stock_count || 0 },
      employees: { active: employees.active_employees || 0 },
      invoices: { pending: invoices.pending_invoices || 0 },
      harvest: { currentYear: harvest.total_harvest || 0 },
      machines: { total: machines.total_machines || 0 },
      upcoming,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
