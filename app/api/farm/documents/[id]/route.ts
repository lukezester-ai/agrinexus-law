import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { documents } from '@/lib/db/schema/documents';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { getSupabaseAdmin } from '@/lib/supabase';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const { db } = getDb();
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .limit(1);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const body = await req.json();
    const { db } = getDb();

    const [doc] = await db
      .update(documents)
      .set({
        name: body.name,
        docType: body.doc_type,
        category: body.category,
        linkedModule: body.linked_module,
        linkedEntityId: body.linked_entity_id,
        description: body.description,
        tags: body.tags,
        isPinned: body.is_pinned,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .returning();

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await resolveTenantId();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { db } = getDb();

    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .limit(1);

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (supabase && doc.fileUrl) {
      const storagePath = doc.fileUrl.split('/tenant_documents/')[1];
      if (storagePath) {
        await supabase.storage.from('tenant_documents').remove([storagePath]);
      }
    }

    await db.delete(documents).where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)));
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
