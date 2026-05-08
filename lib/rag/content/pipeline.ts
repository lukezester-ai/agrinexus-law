/**
 * End-to-end content pipeline за `agrinexus-mvp`:
 *   fetch (local или HTTP) → parse (PDF/HTML/DOCX/text) → chunk → embed (OpenAI)
 *   → upsert в `knowledge_chunks` (source_type='public_document').
 *
 * Идемпотентен per-document: преди upsert-а изтриваме всички съществуващи
 * chunks за `(source_type, source_id)` и пишем наново. Така замяна на
 * метаданен запис (chunk_index=0 само със заглавие) с реално съдържание
 * (десетки чункове) става атомарно.
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import { chunkText, sha256 } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embeddings";
import type { ChunkSourceType } from "@/lib/rag/vector-search";

import { fetchDocument } from "./fetcher";
import { extractPdfText } from "./pdf-parser";
import { stripHtmlToText } from "./html-stripper";
import { extractDocxText } from "./docx-parser";
import {
  extractPdfTextWithOcr,
  isOcrEnabled,
  ocrMinTextChars,
} from "./ocr";

export type ContentDocInput = {
  url: string;
  sourceId: string;
  title: string;
  category?: string | null;
  docType?: string | null;
  sourceName?: string | null;
  effectiveDate?: string | null;
  metadata?: Record<string, unknown>;
};

export type ContentIndexResult = {
  url: string;
  sourceId: string;
  status: "indexed" | "empty" | "failed";
  chunks: number;
  bytes: number;
  usedOcr?: boolean;
  error?: string;
};

const SOURCE_TYPE: ChunkSourceType = "public_document";
const EMBED_BATCH_SIZE = 32;

function inferMimeKind(
  contentType: string,
  url: string,
): "pdf" | "html" | "text" | "docx" {
  const ct = contentType.toLowerCase();
  if (ct.includes("pdf") || /\.pdf(\?|#|$)/i.test(url)) return "pdf";
  if (
    ct.includes("officedocument.wordprocessingml.document") ||
    ct.includes("application/msword") ||
    /\.docx?(\?|#|$)/i.test(url)
  ) {
    return "docx";
  }
  if (ct.includes("html") || ct.includes("xhtml")) return "html";
  if (ct.includes("text/plain") || /\.txt(\?|#|$)/i.test(url)) return "text";
  if (/\.html?(\?|#|$)/i.test(url)) return "html";
  return "html";
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function extractTextForDoc(
  bytes: Uint8Array,
  contentType: string,
  url: string,
): Promise<{ text: string; titleFromBody: string | null; usedOcr: boolean }> {
  const kind = inferMimeKind(contentType, url);
  if (kind === "pdf") {
    const text = await extractPdfText(bytes);
    if (isOcrEnabled() && text.trim().length < ocrMinTextChars()) {
      try {
        const ocrText = await extractPdfTextWithOcr(bytes);
        if (ocrText.trim().length > text.trim().length) {
          return { text: ocrText, titleFromBody: null, usedOcr: true };
        }
      } catch {
        /* OCR best-effort */
      }
    }
    return { text, titleFromBody: null, usedOcr: false };
  }
  if (kind === "docx") {
    const text = await extractDocxText(bytes);
    return { text, titleFromBody: null, usedOcr: false };
  }
  if (kind === "html") {
    const html = bytesToUtf8(bytes);
    const stripped = stripHtmlToText(html);
    return {
      text: stripped.text,
      titleFromBody: stripped.title,
      usedOcr: false,
    };
  }
  return { text: bytesToUtf8(bytes), titleFromBody: null, usedOcr: false };
}

async function deleteExistingChunksForSource(sourceId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("source_type", SOURCE_TYPE)
    .eq("source_id", sourceId);
}

/**
 * Индексира съдържанието на един документ. Безопасно е да се вика паралелно
 * за различни (sourceId) — Supabase upsert е idempotent per row.
 */
export async function indexDocumentContent(
  doc: ContentDocInput,
): Promise<ContentIndexResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      url: doc.url,
      sourceId: doc.sourceId,
      status: "failed",
      chunks: 0,
      bytes: 0,
      error: "Supabase admin client липсва.",
    };
  }

  try {
    const fetched = await fetchDocument(doc.url);
    const { text, titleFromBody, usedOcr } = await extractTextForDoc(
      fetched.bytes,
      fetched.contentType,
      doc.url,
    );
    const trimmed = text.trim();
    if (trimmed.length < 80) {
      return {
        url: doc.url,
        sourceId: doc.sourceId,
        status: "empty",
        chunks: 0,
        bytes: fetched.bytes.byteLength,
        usedOcr,
      };
    }

    const chunks = chunkText(trimmed);
    if (chunks.length === 0) {
      return {
        url: doc.url,
        sourceId: doc.sourceId,
        status: "empty",
        chunks: 0,
        bytes: fetched.bytes.byteLength,
        usedOcr,
      };
    }

    const title = doc.title || titleFromBody || doc.url;
    const baseMetadata = {
      ...(doc.metadata ?? {}),
      ingest_source_url: doc.url,
      content_bytes: fetched.bytes.byteLength,
      ...(usedOcr ? { ocr_used: true } : {}),
    };

    await deleteExistingChunksForSource(doc.sourceId);

    let totalRows = 0;
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
      const inputs = batch.map(
        (ch) => `${title}\n\n${ch.text}`.replace(/\s+/g, " ").trim(),
      );
      const embeddings = await embedBatch(inputs);

      const rows = await Promise.all(
        batch.map(async (ch, j) => {
          const hash = await sha256(`${doc.sourceId}|${ch.index}|${ch.text}`);
          return {
            source_type: SOURCE_TYPE,
            source_id: doc.sourceId,
            chunk_index: ch.index,
            title,
            category: doc.category ?? null,
            doc_type: doc.docType ?? null,
            source_name: doc.sourceName ?? null,
            effective_date: doc.effectiveDate ?? null,
            content: ch.text,
            content_hash: hash,
            metadata: baseMetadata,
            embedding: embeddings[j] as unknown as string,
            updated_at: new Date().toISOString(),
          };
        }),
      );

      const { error } = await supabase
        .from("knowledge_chunks")
        .upsert(rows, { onConflict: "source_type,source_id,chunk_index" });
      if (error) {
        return {
          url: doc.url,
          sourceId: doc.sourceId,
          status: "failed" as const,
          chunks: totalRows,
          bytes: fetched.bytes.byteLength,
          usedOcr,
          error: error.message,
        };
      }
      totalRows += rows.length;
    }

    return {
      url: doc.url,
      sourceId: doc.sourceId,
      status: "indexed",
      chunks: totalRows,
      bytes: fetched.bytes.byteLength,
      usedOcr,
    };
  } catch (e) {
    return {
      url: doc.url,
      sourceId: doc.sourceId,
      status: "failed",
      chunks: 0,
      bytes: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export type IndexPublicDocsOptions = {
  limit?: number;
  onlySourceIds?: string[];
};

export type IndexPublicDocsSummary = {
  scanned: number;
  indexed: number;
  empty: number;
  failed: number;
  totalChunks: number;
  totalBytes: number;
  ocrUsed: number;
  results: ContentIndexResult[];
  errors: string[];
};

/**
 * Чете URL-и от `public_documents` и пуска индексиращия pipeline за всеки
 * (replace-all per source_id). Връща компактно резюме.
 */
export async function indexPublicDocumentsContent(
  opts: IndexPublicDocsOptions = {},
): Promise<IndexPublicDocsSummary> {
  const limit =
    typeof opts.limit === "number" && opts.limit > 0
      ? Math.floor(opts.limit)
      : 50;

  const summary: IndexPublicDocsSummary = {
    scanned: 0,
    indexed: 0,
    empty: 0,
    failed: 0,
    totalChunks: 0,
    totalBytes: 0,
    ocrUsed: 0,
    results: [],
    errors: [],
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    summary.errors.push("Supabase admin client липсва.");
    return summary;
  }

  let query = supabase
    .from("public_documents")
    .select(
      "id, title, institution, category, doc_type, source_url, effective_date",
    )
    .eq("status", "active")
    .order("effective_date", { ascending: false })
    .limit(limit);

  if (opts.onlySourceIds && opts.onlySourceIds.length > 0) {
    query = query.in("id", opts.onlySourceIds);
  }

  const { data, error } = await query;
  if (error) {
    summary.errors.push(`select public_documents failed: ${error.message}`);
    return summary;
  }

  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    institution: string | null;
    category: string | null;
    doc_type: string | null;
    source_url: string | null;
    effective_date: string | null;
  }>;

  for (const row of rows) {
    if (!row.source_url) continue;
    summary.scanned += 1;
    const r = await indexDocumentContent({
      url: row.source_url,
      sourceId: String(row.id),
      title: row.title,
      category: row.category,
      docType: row.doc_type,
      sourceName: row.institution,
      effectiveDate: row.effective_date,
      metadata: {
        institution: row.institution,
      },
    });
    summary.results.push(r);
    if (r.usedOcr) summary.ocrUsed += 1;
    if (r.status === "indexed") {
      summary.indexed += 1;
      summary.totalChunks += r.chunks;
      summary.totalBytes += r.bytes;
    } else if (r.status === "empty") {
      summary.empty += 1;
    } else {
      summary.failed += 1;
      if (r.error) summary.errors.push(`${r.url}: ${r.error}`);
    }
  }

  return summary;
}
