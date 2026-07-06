import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { vatJournals } from '@/lib/db/schema/vat_journals';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();

    const existing = await db
      .select()
      .from(vatJournals)
      .where(and(eq(vatJournals.id, id), eq(vatJournals.tenantId, tenantId)))
      .limit(1);
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.delete(vatJournals).where(eq(vatJournals.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
