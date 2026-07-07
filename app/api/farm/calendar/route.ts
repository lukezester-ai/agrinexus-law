import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { sql } from 'drizzle-orm';

function getMonthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end, startStr: start.toISOString(), endStr: end.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const { startStr, endStr } = getMonthRange(month);

    const { db } = getDb();

    const result = await db.execute(sql`
      SELECT id, title, date, type, entity_type, entity_id, metadata FROM (
        SELECT r.id, r.title, r.due_date::text as date, 'reminder' as type, r.entity_type, r.entity_id, '{}'::jsonb as metadata
        FROM reminders r WHERE r.tenant_id = ${tenantId} AND r.due_date >= ${startStr}::timestamp AND r.due_date <= ${endStr}::timestamp
        UNION ALL
        SELECT ms.id, m.name || ' - ' || ms.type as title, ms.date::text as date, 'service' as type, 'machine' as entity_type, ms.machine_id as entity_id,
          jsonb_build_object('machine_name', m.name, 'service_type', ms.type) as metadata
        FROM machine_services ms JOIN machines m ON m.id = ms.machine_id
        WHERE ms.tenant_id = ${tenantId} AND ms.date >= ${startStr}::timestamp AND ms.date <= ${endStr}::timestamp
        UNION ALL
        SELECT ca.id, cp.name || ' - ' || f.name as title, ca.application_date::text as date, 'application' as type, 'field' as entity_type, ca.field_id as entity_id,
          jsonb_build_object('product_name', cp.name, 'field_name', f.name, 'dose', ca.dose_amount, 'unit', ca.dose_unit) as metadata
        FROM chemical_applications ca
        LEFT JOIN chemical_products cp ON cp.id = ca.product_id
        LEFT JOIN fields f ON f.id = ca.field_id
        WHERE ca.tenant_id = ${tenantId} AND ca.application_date >= ${startStr}::timestamp AND ca.application_date <= ${endStr}::timestamp
        UNION ALL
        SELECT hr.id, f.name || ' - прибиране' as title, hr.date::text as date, 'harvest' as type, 'field' as entity_type, hr.field_id as entity_id,
          jsonb_build_object('field_name', f.name, 'yield', hr.yield_amount, 'unit', hr.yield_unit) as metadata
        FROM harvest_records hr LEFT JOIN fields f ON f.id = hr.field_id
        WHERE hr.tenant_id = ${tenantId} AND hr.date >= ${startStr}::timestamp AND hr.date <= ${endStr}::timestamp
        UNION ALL
        SELECT i.id, 'Фактура ' || i.invoice_number || ' - ' || i.client_name as title, i.due_date::text as date, 'invoice' as type, 'invoice' as entity_type, i.id as entity_id,
          jsonb_build_object('invoice_number', i.invoice_number, 'client_name', i.client_name, 'total', i.total_amount, 'status', i.status) as metadata
        FROM invoices i
        WHERE i.tenant_id = ${tenantId} AND i.due_date IS NOT NULL AND i.due_date >= ${startStr}::timestamp AND i.due_date <= ${endStr}::timestamp
        UNION ALL
        SELECT pi.id, 'Покупка ' || pi.invoice_number || ' - ' || pi.supplier_name as title, pi.due_date::text as date, 'purchase' as type, 'purchase_invoice' as entity_type, pi.id as entity_id,
          jsonb_build_object('invoice_number', pi.invoice_number, 'supplier_name', pi.supplier_name, 'total', pi.total_amount, 'status', pi.status) as metadata
        FROM purchase_invoices pi
        WHERE pi.tenant_id = ${tenantId} AND pi.due_date IS NOT NULL AND pi.due_date >= ${startStr}::timestamp AND pi.due_date <= ${endStr}::timestamp
      ) events
      ORDER BY date
    `);

    return NextResponse.json((result as any).rows);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
