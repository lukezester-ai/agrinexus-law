import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { machines } from '@/lib/db/schema/machines';
import { fixedAssets } from '@/lib/db/schema/fixed_assets';
import { reminders } from '@/lib/db/schema/reminders';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

/**
 * TICKET 2 (P0): Cron daily scan to generate reminders from Machines (GTP, Insurance)
 * and Fixed Assets (Amortization deadlines) X days ahead (default 14 days).
 */
export async function POST(req: NextRequest) {
  return runAutoRemindersScan(req);
}

export async function GET(req: NextRequest) {
  return runAutoRemindersScan(req);
}

async function runAutoRemindersScan(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();

    // Threshold in days (configurable via query param ?threshold=14)
    const { searchParams } = new URL(req.url);
    const thresholdDays = Number(searchParams.get('threshold')) || 14;

    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + thresholdDays);

    const [allMachines, allAssets, existingReminders] = await Promise.all([
      db.select().from(machines).where(and(eq(machines.tenantId, tenantId), eq(machines.status, 'active'))),
      db.select().from(fixedAssets).where(and(eq(fixedAssets.tenantId, tenantId), eq(fixedAssets.isActive, 'true'))),
      db.select().from(reminders).where(eq(reminders.tenantId, tenantId)),
    ]);

    let createdCount = 0;
    let updatedCount = 0;

    // Helper to check and upsert reminder
    const checkAndUpsertReminder = async (entityType: string, entityId: string, title: string, dueDate: Date, descText: string) => {
      // If dueDate is within [now - 30 days, thresholdDate]
      const minDate = new Date();
      minDate.setDate(now.getDate() - 30);
      if (dueDate >= minDate && dueDate <= thresholdDate) {
        const existing = existingReminders.find(r => r.entityType === entityType && r.entityId === entityId);
        if (!existing) {
          await db.insert(reminders).values({
            tenantId,
            title,
            description: descText,
            dueDate,
            isCompleted: 'false',
            entityType,
            entityId,
          });
          createdCount++;
        } else if (existing.isCompleted === 'false' && Math.abs(new Date(existing.dueDate).getTime() - dueDate.getTime()) > 86400000) {
          await db.update(reminders)
            .set({ title, description: descText, dueDate, updatedAt: new Date() })
            .where(eq(reminders.id, existing.id));
          updatedCount++;
        }
      }
    };

    // 1. Scan machines for GTP and Insurance
    for (const m of allMachines) {
      if (m.gtpExpiryDate) {
        const dueDate = new Date(m.gtpExpiryDate);
        await checkAndUpsertReminder(
          'machine_gtp',
          m.id,
          `🚜 ГТП край: ${m.name} (${m.plateNumber || 'Без рег.'})`,
          dueDate,
          `Срок за Годишен Технически Преглед (ГТП) на машина ${m.name} (${m.make || ''} ${m.model || ''}).`
        );
      }
      if (m.insuranceExpiryDate) {
        const dueDate = new Date(m.insuranceExpiryDate);
        await checkAndUpsertReminder(
          'machine_insurance',
          m.id,
          `🛡️ Застраховка край: ${m.name} (${m.plateNumber || 'Без рег.'})`,
          dueDate,
          `Срок за подновяване на ГО / Автокаско за машина ${m.name}.`
        );
      }
    }

    // 2. Scan fixed assets for amortization end dates
    for (const a of allAssets) {
      if (a.acquisitionDate && a.usefulLifeMonths) {
        const acqDate = new Date(a.acquisitionDate);
        const months = Number(a.usefulLifeMonths) || 0;
        if (months > 0 && !isNaN(acqDate.getTime())) {
          const amortEndDate = new Date(acqDate);
          amortEndDate.setMonth(acqDate.getMonth() + months);
          await checkAndUpsertReminder(
            'fixed_asset_amortization',
            a.id,
            `🏛️ Край на амортизация: ${a.name} (${a.inventoryNumber})`,
            amortEndDate,
            `Дълготрайният актив "${a.name}" достига края на своя амортизационен срок (${months} мес.).`
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      scannedMachines: allMachines.length,
      scannedAssets: allAssets.length,
      remindersCreated: createdCount,
      remindersUpdated: updatedCount,
    });
  } catch (err: any) {
    console.error('Auto reminders scan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
