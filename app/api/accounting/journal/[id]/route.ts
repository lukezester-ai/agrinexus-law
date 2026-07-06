import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { journalHeaders, journalLines } from '@/lib/db/schema/journal_entries';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { entryDate, description, documentType, status, lines } = body;
    const { db } = getDb();

    const existing = await db
      .select()
      .from(journalHeaders)
      .where(and(eq(journalHeaders.id, id), eq(journalHeaders.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Записът не е намерен' }, { status: 404 });
    }

    await db
      .update(journalHeaders)
      .set({ entryDate: entryDate ? new Date(entryDate) : undefined, description: description ?? null, documentType: documentType ?? null, status })
      .where(eq(journalHeaders.id, id));

    if (lines) {
      await db.delete(journalLines).where(eq(journalLines.journalId, id));
      for (const line of lines) {
        await db.insert(journalLines).values({
          journalId: id,
          accountId: line.accountId,
          entryType: line.entryType,
          amount: String(line.amount),
          description: line.description || null,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();

    const existing = await db
      .select()
      .from(journalHeaders)
      .where(and(eq(journalHeaders.id, id), eq(journalHeaders.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Записът не е намерен' }, { status: 404 });
    }

    await db.delete(journalHeaders).where(eq(journalHeaders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
