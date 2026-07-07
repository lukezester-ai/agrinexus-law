import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { notifications } from '@/lib/db/schema/notifications';
import { sql, and, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    let created = 0;

    // 1. Low stock items (currentStock <= minStock)
    const lowStock = await db.execute(sql`
      SELECT id, name, current_stock, min_stock FROM inventory_items
      WHERE tenant_id = ${tenantId} AND min_stock IS NOT NULL AND current_stock <= min_stock
    `);
    const lowRows = (lowStock as any).rows || [];
    for (const item of lowRows) {
      const existing = await db.select({ id: notifications.id }).from(notifications)
        .where(and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, 'false'),
          sql`type = 'low_stock' AND title LIKE ${'%' + item.name + '%'}`)).limit(1);
      if (!existing.length) {
        await db.insert(notifications).values({
          tenantId, type: 'low_stock',
          title: `Ниска наличност: ${item.name}`,
          message: `Текущо: ${item.current_stock}, Минимум: ${item.min_stock}`,
          link: '/moya-ferma/sklad',
        });
        created++;
      }
    }

    // 2. Machine services due (no service in last 30 days)
    const machinesDue = await db.execute(sql`
      SELECT id, name FROM machines
      WHERE tenant_id = ${tenantId} AND status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM machine_services ms
        WHERE ms.machine_id = machines.id AND ms.date > CURRENT_DATE - 30
      )
    `);
    const machRows = (machinesDue as any).rows || [];
    for (const m of machRows) {
      const existing = await db.select({ id: notifications.id }).from(notifications)
        .where(and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, 'false'),
          sql`type = 'service_due' AND title LIKE ${'%' + m.name + '%'}`)).limit(1);
      if (!existing.length) {
        await db.insert(notifications).values({
          tenantId, type: 'service_due',
          title: `Сервиз: ${m.name}`,
          message: 'Няма регистриран сервиз над 30 дни',
          link: '/moya-ferma/mashini',
        });
        created++;
      }
    }

    // 3. Pending invoices due in next 7 days
    const dueInvoices = await db.execute(sql`
      SELECT invoice_number, client_name, due_date FROM invoices
      WHERE tenant_id = ${tenantId} AND status = 'issued' AND due_date < CURRENT_DATE + 7
    `);
    const invRows = (dueInvoices as any).rows || [];
    for (const inv of invRows) {
      const existing = await db.select({ id: notifications.id }).from(notifications)
        .where(and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, 'false'),
          sql`type = 'invoice_due' AND title LIKE ${'%' + inv.invoice_number + '%'}`)).limit(1);
      if (!existing.length) {
        await db.insert(notifications).values({
          tenantId, type: 'invoice_due',
          title: `Фактура ${inv.invoice_number} — ${inv.client_name}`,
          message: `Падеж: ${new Date(inv.due_date).toLocaleDateString('bg-BG')}`,
          link: '/moya-ferma/schetovodstvo/smetki',
        });
        created++;
      }
    }

    // 4. Upcoming reminders (due in next 7 days, not completed)
    const upcoming = await db.execute(sql`
      SELECT id, title, due_date FROM reminders
      WHERE tenant_id = ${tenantId} AND is_completed = 'false'
        AND due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + 7
    `);
    const remRows = (upcoming as any).rows || [];
    for (const r of remRows) {
      const existing = await db.select({ id: notifications.id }).from(notifications)
        .where(and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, 'false'),
          sql`type = 'reminder' AND title LIKE ${'%' + r.title + '%'}`)).limit(1);
      if (!existing.length) {
        await db.insert(notifications).values({
          tenantId, type: 'reminder',
          title: `Напомняне: ${r.title}`,
          link: '/moya-ferma',
        });
        created++;
      }
    }

    return NextResponse.json({ notificationsCreated: created });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
