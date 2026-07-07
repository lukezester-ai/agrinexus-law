import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { notifications } from '@/lib/db/schema/notifications';
import { sql, and, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { db } = getDb();
    const tenants = await db.execute(sql`SELECT id, name FROM tenants WHERE plan != 'free'`);
    const tenantRows = (tenants as any).rows || [];
    let totalCreated = 0;

    for (const tenant of tenantRows) {
      const tid = tenant.id;

      // 1. Low stock
      const lowStock = await db.execute(sql`
        SELECT name, current_stock, min_stock FROM inventory_items
        WHERE tenant_id = ${tid} AND min_stock IS NOT NULL AND current_stock <= min_stock
      `);
      for (const item of (lowStock as any).rows || []) {
        const existing = await db.select({ id: notifications.id }).from(notifications)
          .where(and(eq(notifications.tenantId, tid), eq(notifications.isRead, 'false'),
            sql`type = 'low_stock' AND title LIKE ${'%' + item.name + '%'}`)).limit(1);
        if (!existing.length) {
          await db.insert(notifications).values({
            tenantId: tid, type: 'low_stock',
            title: `Ниска наличност: ${item.name}`,
            message: `Текущо: ${item.current_stock}, Минимум: ${item.min_stock}`,
            link: '/moya-ferma/sklad',
          });
          totalCreated++;
        }
      }

      // 2. Invoice due
      const dueInvoices = await db.execute(sql`
        SELECT invoice_number, client_name, due_date FROM invoices
        WHERE tenant_id = ${tid} AND status = 'issued' AND due_date < CURRENT_DATE + 7
      `);
      for (const inv of (dueInvoices as any).rows || []) {
        const existing = await db.select({ id: notifications.id }).from(notifications)
          .where(and(eq(notifications.tenantId, tid), eq(notifications.isRead, 'false'),
            sql`type = 'invoice_due' AND title LIKE ${'%' + inv.invoice_number + '%'}`)).limit(1);
        if (!existing.length) {
          await db.insert(notifications).values({
            tenantId: tid, type: 'invoice_due',
            title: `Фактура ${inv.invoice_number} — ${inv.client_name}`,
            message: `Падеж: ${new Date(inv.due_date).toLocaleDateString('bg-BG')}`,
            link: '/moya-ferma/schetovodstvo/smetki',
          });
          totalCreated++;
        }
      }

      // 3. Machine service due
      const machinesDue = await db.execute(sql`
        SELECT m.name FROM machines m
        WHERE m.tenant_id = ${tid} AND m.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM machine_services ms
          WHERE ms.machine_id = m.id AND ms.date > CURRENT_DATE - 30
        )
      `);
      for (const m of (machinesDue as any).rows || []) {
        const existing = await db.select({ id: notifications.id }).from(notifications)
          .where(and(eq(notifications.tenantId, tid), eq(notifications.isRead, 'false'),
            sql`type = 'service_due' AND title LIKE ${'%' + m.name + '%'}`)).limit(1);
        if (!existing.length) {
          await db.insert(notifications).values({
            tenantId: tid, type: 'service_due',
            title: `Сервиз: ${m.name}`,
            message: 'Няма регистриран сервиз над 30 дни',
            link: '/moya-ferma/mashini',
          });
          totalCreated++;
        }
      }
    }

    return NextResponse.json({ notificationsCreated: totalCreated, tenantsProcessed: tenantRows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
