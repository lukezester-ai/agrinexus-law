import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { journalHeaders, journalLines } from '@/lib/db/schema/journal_entries';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, desc, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const { db } = getDb();

    const headers = await db
      .select()
      .from(journalHeaders)
      .where(eq(journalHeaders.tenantId, tenantId))
      .orderBy(desc(journalHeaders.entryDate))
      .limit(200);

    const headerIds = headers.map((h) => h.id);
    const lines = headerIds.length > 0
      ? await db
          .select({
            id: journalLines.id,
            journalId: journalLines.journalId,
            accountId: journalLines.accountId,
            entryType: journalLines.entryType,
            amount: journalLines.amount,
            description: journalLines.description,
            accountNumber: accountPlan.accountNumber,
            accountName: accountPlan.name,
          })
          .from(journalLines)
          .leftJoin(accountPlan, eq(journalLines.accountId, accountPlan.id))
          .where(inArray(journalLines.journalId, headerIds))
      : [];

    const lineMap = new Map<string, typeof lines>();
    for (const l of lines) {
      const arr = lineMap.get(l.journalId) || [];
      arr.push(l);
      lineMap.set(l.journalId, arr);
    }

    const result = headers
      .filter((h) => !search || h.journalNumber.toLowerCase().includes(search.toLowerCase()) || (h.description || '').toLowerCase().includes(search.toLowerCase()))
      .map((h) => ({
        id: h.id,
        journalNumber: h.journalNumber,
        entryDate: h.entryDate,
        description: h.description,
        documentType: h.documentType,
        status: h.status,
        postedBy: h.postedBy,
        postedAt: h.postedAt,
        createdAt: h.createdAt,
        lines: lineMap.get(h.id) || [],
      }));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { entryDate, description, documentType, status, lines } = body;

    if (!entryDate || !lines || lines.length < 2) {
      return NextResponse.json({ error: 'Необходими са дата и поне 2 статии' }, { status: 400 });
    }

    const { db } = getDb();

    const year = new Date(entryDate).getFullYear();
    const count = await db
      .select({ count: journalHeaders.id })
      .from(journalHeaders)
      .where(eq(journalHeaders.tenantId, tenantId))
      .then((r) => r.length + 1);
    const journalNumber = `${year}-${String(count).padStart(5, '0')}`;

    const [header] = await db
      .insert(journalHeaders)
      .values({
        tenantId,
        journalNumber,
        entryDate: new Date(entryDate),
        description: description || null,
        documentType: documentType || null,
        status: status || 'draft',
      })
      .returning();

    for (const line of lines) {
      await db.insert(journalLines).values({
        journalId: header.id,
        accountId: line.accountId,
        entryType: line.entryType,
        amount: String(line.amount),
        description: line.description || null,
      });
    }

    return NextResponse.json(header, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
