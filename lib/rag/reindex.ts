/**
 * Индексира knowledge база в Supabase `knowledge_chunks` (vector store).
 *
 * Източници:
 *   - 'static'           → KNOWLEDGE_BASE от lib/knowledge/dfz-knowledge*.ts
 *   - 'learned'          → knowledge_learned_items (Supabase)
 *   - 'public_document'  → public_documents (Supabase) — само metadata,
 *                          PDF-съдържание трябва да се извлече отделно (не е MVP).
 *
 * Стратегия за idempotency:
 *   Изчислява content_hash = sha256(source_id || chunk_index || content).
 *   Ако в DB вече има chunk със същия (source_type, source_id, chunk_index, content_hash)
 *   → пропуска се. Иначе — upsert + нов embedding.
 */

import { getSupabaseAdmin } from "@/lib/supabase";
import { KNOWLEDGE_BASE } from "@/lib/knowledge/dfz-knowledge";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { chunkText, sha256 } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embeddings";
import type { ChunkSourceType } from "@/lib/rag/vector-search";
import {
  indexPublicDocumentsContent,
  type IndexPublicDocsOptions,
  type IndexPublicDocsSummary,
} from "@/lib/rag/content/pipeline";
import { shutdownOcr } from "@/lib/rag/content/ocr";

export interface ReindexStats {
  source: ChunkSourceType;
  documentsScanned: number;
  chunksCreated: number;
  chunksSkipped: number;
  chunksFailed: number;
  errors: string[];
}

interface PendingChunk {
  source_type: ChunkSourceType;
  source_id: string;
  chunk_index: number;
  title: string;
  category: string | null;
  doc_type: string | null;
  source_name: string | null;
  effective_date: string | null;
  content: string;
  content_hash: string;
  metadata: Record<string, unknown>;
}

/** Прави текста за embedding. Заглавието се добавя за по-добро намиране. */
function buildEmbeddingInput(title: string, content: string): string {
  return `${title}\n\n${content}`;
}

async function existingHashes(
  source_type: ChunkSourceType,
  source_ids: string[],
): Promise<Map<string, Set<string>>> {
  const supabase = getSupabaseAdmin();
  const out = new Map<string, Set<string>>();
  if (!supabase || source_ids.length === 0) return out;

  const { data, error } = await supabase
    .from("knowledge_chunks")
    .select("source_id, content_hash")
    .eq("source_type", source_type)
    .in("source_id", source_ids);

  if (error) {
    console.error("existingHashes error:", error.message);
    return out;
  }
  for (const row of data ?? []) {
    const sid = row.source_id as string;
    const hash = row.content_hash as string;
    if (!out.has(sid)) out.set(sid, new Set());
    out.get(sid)!.add(hash);
  }
  return out;
}

async function flushBatch(
  pending: PendingChunk[],
  stats: ReindexStats,
): Promise<void> {
  if (pending.length === 0) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    stats.chunksFailed += pending.length;
    stats.errors.push("Supabase admin client липсва.");
    return;
  }

  let embeddings: number[][];
  try {
    embeddings = await embedBatch(
      pending.map((p) => buildEmbeddingInput(p.title, p.content)),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    stats.chunksFailed += pending.length;
    stats.errors.push(`embedBatch failed: ${msg}`);
    return;
  }

  const rows = pending.map((p, i) => ({
    source_type: p.source_type,
    source_id: p.source_id,
    chunk_index: p.chunk_index,
    title: p.title,
    category: p.category,
    doc_type: p.doc_type,
    source_name: p.source_name,
    effective_date: p.effective_date,
    content: p.content,
    content_hash: p.content_hash,
    metadata: p.metadata,
    embedding: embeddings[i] as unknown as string,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("knowledge_chunks")
    .upsert(rows, { onConflict: "source_type,source_id,chunk_index" });

  if (error) {
    stats.chunksFailed += rows.length;
    stats.errors.push(`upsert failed: ${error.message}`);
    return;
  }
  stats.chunksCreated += rows.length;
}

async function indexKnowledgeDocs(
  docs: KnowledgeDoc[],
  source_type: ChunkSourceType,
): Promise<ReindexStats> {
  const stats: ReindexStats = {
    source: source_type,
    documentsScanned: docs.length,
    chunksCreated: 0,
    chunksSkipped: 0,
    chunksFailed: 0,
    errors: [],
  };

  const sourceIds = docs.map((d) => d.id);
  const existing = await existingHashes(source_type, sourceIds);

  const BATCH = 32;
  let pending: PendingChunk[] = [];

  for (const doc of docs) {
    const chunks = chunkText(doc.content);
    if (chunks.length === 0) continue;

    for (const ch of chunks) {
      const hash = await sha256(`${doc.id}|${ch.index}|${ch.text}`);
      const known = existing.get(doc.id);
      if (known && known.has(hash)) {
        stats.chunksSkipped += 1;
        continue;
      }
      pending.push({
        source_type,
        source_id: doc.id,
        chunk_index: ch.index,
        title: doc.title,
        category: doc.category ?? null,
        doc_type: doc.type ?? null,
        source_name: doc.source ?? null,
        effective_date: doc.effectiveDate ?? null,
        content: ch.text,
        content_hash: hash,
        metadata: { keywords: doc.keywords ?? [] },
      });

      if (pending.length >= BATCH) {
        await flushBatch(pending, stats);
        pending = [];
      }
    }
  }
  await flushBatch(pending, stats);

  return stats;
}

/** Индексира статичната KNOWLEDGE_BASE (in-repo TS). */
export async function reindexStatic(): Promise<ReindexStats> {
  return indexKnowledgeDocs(KNOWLEDGE_BASE, "static");
}

/** Индексира knowledge_learned_items от Supabase. */
export async function reindexLearned(): Promise<ReindexStats> {
  const supabase = getSupabaseAdmin();
  const stats: ReindexStats = {
    source: "learned",
    documentsScanned: 0,
    chunksCreated: 0,
    chunksSkipped: 0,
    chunksFailed: 0,
    errors: [],
  };
  if (!supabase) {
    stats.errors.push("Supabase admin client липсва.");
    return stats;
  }
  const { data, error } = await supabase
    .from("knowledge_learned_items")
    .select("id, title, category, type, content, keywords, source, effective_date")
    .eq("is_active", true)
    .limit(500);
  if (error) {
    stats.errors.push(`select learned failed: ${error.message}`);
    return stats;
  }
  const docs: KnowledgeDoc[] = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    category: String(row.category ?? "Практически насоки"),
    type: (row.type as KnowledgeDoc["type"]) ?? "regulation",
    content: String(row.content ?? ""),
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    source: String(row.source ?? "Learned from chat feedback"),
    effectiveDate: String(row.effective_date ?? new Date().toISOString().slice(0, 10)),
  }));
  return indexKnowledgeDocs(docs, "learned");
}

/**
 * Индексира public_documents (само заглавия + категория, без PDF съдържание).
 * Това дава частична полза — позволява RAG да върне title-level reference.
 * Пълно extracting на PDF е извън обхвата на това MVP.
 */
export async function reindexPublicDocuments(): Promise<ReindexStats> {
  const supabase = getSupabaseAdmin();
  const stats: ReindexStats = {
    source: "public_document",
    documentsScanned: 0,
    chunksCreated: 0,
    chunksSkipped: 0,
    chunksFailed: 0,
    errors: [],
  };
  if (!supabase) {
    stats.errors.push("Supabase admin client липсва.");
    return stats;
  }
  const { data, error } = await supabase
    .from("public_documents")
    .select("id, title, institution, category, doc_type, source_url, effective_date")
    .eq("status", "active")
    .limit(1000);
  if (error) {
    stats.errors.push(`select public_documents failed: ${error.message}`);
    return stats;
  }
  const docs: KnowledgeDoc[] = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    category: String(row.category ?? "Нормативни актове"),
    type: (row.doc_type as KnowledgeDoc["type"]) ?? "regulation",
    content: `Заглавие: ${row.title}
Институция: ${row.institution}
Категория: ${row.category}
URL: ${row.source_url}`,
    keywords: [String(row.institution ?? ""), String(row.category ?? "")],
    source: String(row.institution ?? "Държавен документ"),
    effectiveDate: String(row.effective_date ?? new Date().toISOString().slice(0, 10)),
  }));
  return indexKnowledgeDocs(docs, "public_document");
}

export async function reindexAll(opts?: {
  includeLearned?: boolean;
  includePublicDocs?: boolean;
}): Promise<ReindexStats[]> {
  const out: ReindexStats[] = [];
  out.push(await reindexStatic());
  if (opts?.includeLearned !== false) {
    out.push(await reindexLearned());
  }
  if (opts?.includePublicDocs !== false) {
    out.push(await reindexPublicDocuments());
  }
  return out;
}

/**
 * Реално индексиране на съдържанието на `public_documents` —
 * изтегля PDF/HTML/DOCX, чънква и записва в `knowledge_chunks` със
 * `source_type='public_document'` (заменя старите metadata-only записи
 * за същия source_id).
 *
 * Резултатът се връща в стандартния `ReindexStats` формат, така че
 * /api/rag/reindex да го емитира еднообразно с другите цели.
 */
export async function reindexPublicDocumentContent(
  opts: IndexPublicDocsOptions = {},
): Promise<ReindexStats & { summary: IndexPublicDocsSummary }> {
  const summary = await indexPublicDocumentsContent(opts);
  try {
    await shutdownOcr();
  } catch {
    /* ignore OCR teardown errors */
  }
  const stats: ReindexStats & { summary: IndexPublicDocsSummary } = {
    source: "public_document",
    documentsScanned: summary.scanned,
    chunksCreated: summary.totalChunks,
    chunksSkipped: summary.empty,
    chunksFailed: summary.failed,
    errors: summary.errors,
    summary,
  };
  return stats;
}
