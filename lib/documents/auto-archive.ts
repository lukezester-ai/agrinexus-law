import { getDb } from '@/lib/db/db';
import { documents } from '@/lib/db/schema/documents';
import { getSupabaseAdmin } from '@/lib/supabase';

export interface AutoArchiveOptions {
  tenantId: string;
  name: string;
  docType?: string;
  category?: string;
  linkedModule?: string | null;
  linkedEntityId?: string | null;
  fileBufferOrString: Buffer | string;
  contentType?: string;
  description?: string | null;
  tags?: string | null;
}

/**
 * TICKET 3 (P0): Central helper to automatically deposit generated PDF/export files into the Documents archive.
 */
export async function autoDepositPdfToArchive(options: AutoArchiveOptions) {
  try {
    const {
      tenantId,
      name,
      docType = 'report',
      category = 'export',
      linkedModule = null,
      linkedEntityId = null,
      fileBufferOrString,
      contentType = 'application/pdf',
      description = null,
      tags = '#авто-архив #експорт',
    } = options;

    const buffer = typeof fileBufferOrString === 'string'
      ? Buffer.from(fileBufferOrString, 'utf-8')
      : fileBufferOrString;

    let fileUrl = '';
    const supabase = getSupabaseAdmin();

    if (supabase) {
      const filePath = `${tenantId}/auto-archive/${crypto.randomUUID()}/${name}`;
      const { error: uploadError } = await supabase.storage
        .from('tenant_documents')
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('tenant_documents').getPublicUrl(filePath);
        fileUrl = urlData?.publicUrl || '';
      }
    }

    // Fallback if no cloud storage active or error: store base64 data URL
    if (!fileUrl) {
      const base64Str = buffer.toString('base64');
      fileUrl = `data:${contentType};base64,${base64Str}`;
    }

    const { db } = getDb();
    const [doc] = await db
      .insert(documents)
      .values({
        tenantId,
        name,
        docType,
        category,
        fileUrl,
        fileType: contentType,
        fileSize: String(buffer.length),
        linkedModule,
        linkedEntityId,
        description: description || `Автоматично архивиран документ от модул "${linkedModule || 'Система'}"`,
        tags,
        isPinned: false,
      })
      .returning();

    return doc;
  } catch (err) {
    console.error('autoDepositPdfToArchive failed:', err);
    return null;
  }
}
