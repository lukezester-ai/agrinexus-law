import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { documents } from '@/lib/db/schema/documents';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { getSupabaseAdmin } from '@/lib/supabase';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const linkedModule = searchParams.get('module');
    const linkedEntityId = searchParams.get('entity_id');

    const { db } = getDb();
    const conditions = [eq(documents.tenantId, tenantId)];
    if (linkedModule) conditions.push(eq(documents.linkedModule, linkedModule));
    if (linkedEntityId) conditions.push(eq(documents.linkedEntityId, linkedEntityId));

    const result = await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.isPinned), desc(documents.createdAt));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

    const name = formData.get('name') as string || file.name;
    const docType = formData.get('doc_type') as string || 'other';
    const category = formData.get('category') as string || null;
    const linkedModule = formData.get('linked_module') as string || null;
    const linkedEntityId = formData.get('linked_entity_id') as string || null;
    const description = formData.get('description') as string || null;
    const tags = formData.get('tags') as string || null;
    const isPinned = formData.get('is_pinned') === 'true';

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${tenantId}/${crypto.randomUUID()}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('tenant_documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from('tenant_documents').getPublicUrl(filePath);
    const fileUrl = urlData?.publicUrl || '';

    const { db } = getDb();
    const [doc] = await db
      .insert(documents)
      .values({
        tenantId, name, docType, category, fileUrl, fileType: file.type,
        fileSize: String(file.size), linkedModule, linkedEntityId,
        description, tags, isPinned,
      })
      .returning();

    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
