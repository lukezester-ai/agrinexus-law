/**
 * Hybrid retrieval: комбинира BM25 (lexical) върху статичната KNOWLEDGE_BASE
 * с vector search в knowledge_chunks (pgvector).
 *
 * Сливане: Reciprocal Rank Fusion (RRF) — score(d) = Σ 1 / (k + rank_i(d))
 * Това е prosto, но устойчиво — не изисква нормализация на различни scale-ове.
 */

import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { KNOWLEDGE_BASE } from "@/lib/knowledge/dfz-knowledge";
import { internalKnowledgeSearch } from "@/lib/knowledge/internal-ai-search";
import { vectorSearchChunks, type MatchedChunk } from "@/lib/rag/vector-search";
import { RAG_CONFIG, isRagEnabled } from "@/lib/rag/config";
import { sortDocuments } from "@/lib/knowledge/document-taxonomy";
import { getUpstashRedis } from "@/lib/utils/rate-limit";

export interface RetrievedItem {
  /** Уникален ключ за дедупликация (chunk id или doc id). */
  key: string;
  title: string;
  category: string | null;
  source_name: string | null;
  content: string;
  /** RRF финален score (по-голям = по-релевантен). */
  score: number;
  /** Откъде идва: vector / lexical / both. */
  origin: "vector" | "lexical" | "both";
  similarity?: number;
  effective_date?: string | null;
  source_type?: "static" | "public_document" | "learned" | "kb_doc";
  source_id?: string;
}

function rrf(rank: number, k: number): number {
  return 1 / (k + rank);
}

function dedupKey(chunk: MatchedChunk): string {
  return `chunk:${chunk.source_type}:${chunk.source_id}:${chunk.chunk_index}`;
}

function lexicalKey(doc: KnowledgeDoc): string {
  return `doc:${doc.id}`;
}

/**
 * Статичните chunks в DB ползват същото `source_id` като lexical `doc:${id}`.
 * След RRF+bonus може да присъстват и целият документ, и chunks — еднакъв източник,
 * двойно в prompt-а. Запазваме страната с по-висок score; при равенство — chunks
 * (обикновено по-компактни от целия doc).
 */
function dedupeStaticDocVersusChunks(fused: Map<string, RetrievedItem>): void {
  const docKeyBySourceId = new Map<string, string>();
  const staticChunkKeysBySourceId = new Map<string, string[]>();

  for (const [key, item] of fused.entries()) {
    if (key.startsWith("doc:")) {
      docKeyBySourceId.set(key.slice(4), key);
    }
    if (
      item.source_type === "static" &&
      item.source_id &&
      key.startsWith("chunk:")
    ) {
      const list = staticChunkKeysBySourceId.get(item.source_id) ?? [];
      list.push(key);
      staticChunkKeysBySourceId.set(item.source_id, list);
    }
  }

  for (const [sourceId, docKey] of docKeyBySourceId) {
    const chunkKeys = staticChunkKeysBySourceId.get(sourceId);
    if (!chunkKeys?.length) continue;

    const docItem = fused.get(docKey);
    if (!docItem) continue;

    let bestChunkScore = Number.NEGATIVE_INFINITY;
    for (const ck of chunkKeys) {
      const ch = fused.get(ck);
      if (ch) bestChunkScore = Math.max(bestChunkScore, ch.score);
    }
    if (bestChunkScore === Number.NEGATIVE_INFINITY) continue;

    if (docItem.score > bestChunkScore) {
      for (const ck of chunkKeys) fused.delete(ck);
    } else {
      fused.delete(docKey);
    }
  }
}

/**
 * Намира релевантните парчета (chunks) и/или цели документи за дадена заявка.
 * Ако RAG е изключен / Supabase не е достъпен → връща само BM25 резултати.
 */
export async function hybridRetrieve(
  query: string,
  opts?: {
    finalTopK?: number;
    vectorTopK?: number;
    lexicalTopK?: number;
    threshold?: number;
  },
): Promise<RetrievedItem[]> {
  const q = (query || "").trim();
  if (!q) return [];

  const finalTopK = opts?.finalTopK ?? RAG_CONFIG.finalTopK;
  const vectorTopK = opts?.vectorTopK ?? RAG_CONFIG.vectorTopK;
  const lexicalTopK = opts?.lexicalTopK ?? RAG_CONFIG.lexicalTopK;
  
  const redis = getUpstashRedis();
  const cacheKey = `rag:hybrid:${finalTopK}:${vectorTopK}:${lexicalTopK}:${q}`;
  
  if (redis) {
    try {
      const cached = await redis.get<RetrievedItem[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch (err) {
      console.error("hybridRetrieve: cache read failed", err);
    }
  }

  const lexicalResult = internalKnowledgeSearch(q, KNOWLEDGE_BASE, {
    limit: lexicalTopK,
  });
  const lexicalDocs = lexicalResult.results;

  let vectorChunks: MatchedChunk[] = [];
  if (isRagEnabled()) {
    try {
      vectorChunks = await vectorSearchChunks(q, {
        topK: vectorTopK,
        threshold: opts?.threshold,
      });
    } catch (err) {
      console.error("hybridRetrieve: vector search failed, falling back:", err);
      vectorChunks = [];
    }
  }

  const fused = new Map<string, RetrievedItem>();

  vectorChunks.forEach((chunk, idx) => {
    const key = dedupKey(chunk);
    const score = rrf(idx + 1, RAG_CONFIG.rrfK);
    fused.set(key, {
      key,
      title: chunk.title,
      category: chunk.category,
      source_name: chunk.source_name,
      content: chunk.content,
      score,
      origin: "vector",
      similarity: chunk.similarity,
      effective_date: chunk.effective_date,
      source_type: chunk.source_type,
      source_id: chunk.source_id,
    });
  });

  lexicalDocs.forEach((doc, idx) => {
    const key = lexicalKey(doc);
    const score = rrf(idx + 1, RAG_CONFIG.rrfK);
    const existing = fused.get(key);
    if (existing) {
      existing.score += score;
      existing.origin = "both";
    } else {
      fused.set(key, {
        key,
        title: doc.title,
        category: doc.category ?? null,
        source_name: doc.source ?? null,
        content: doc.content,
        score,
        origin: "lexical",
        effective_date: doc.effectiveDate ?? null,
        source_type: "kb_doc",
        source_id: doc.id,
      });
    }
  });

  // Bonus: ако chunk идва от static doc, който също се появява в lexical → boost
  for (const item of fused.values()) {
    if (item.source_type === "static" && item.source_id) {
      const docKey = `doc:${item.source_id}`;
      const docHit = fused.get(docKey);
      if (docHit) {
        item.score += docHit.score * 0.5;
        item.origin = "both";
      }
    }
  }

  dedupeStaticDocVersusChunks(fused);

  const ranked = Array.from(fused.values()).sort((a, b) => b.score - a.score);

  const asSortable = ranked.map((item) => ({
    id: item.key,
    title: item.title,
    category: item.category ?? "",
    type: inferDocTypeFromRetrieved(item),
    effectiveDate: item.effective_date ?? "1970-01-01",
    score: item.score,
  }));
  const sorted = sortDocuments(asSortable, "relevance");
  const order = new Map(sorted.map((s, i) => [s.id, i]));
  ranked.sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999));

  const resultList = ranked.slice(0, finalTopK);

  if (redis && resultList.length > 0) {
    try {
      // Кешираме за 24 часа, тъй като нормативните документи не се променят на всяка минута
      await redis.setex(cacheKey, 60 * 60 * 24, resultList);
    } catch (err) {
      console.error("hybridRetrieve: cache write failed", err);
    }
  }

  return resultList;
}

function inferDocTypeFromRetrieved(
  item: RetrievedItem,
): "scheme" | "regulation" | "procedure" | "deadline" {
  const hay = `${item.title} ${item.content}`.toLowerCase();
  if (/срок|краен/i.test(hay)) return "deadline";
  if (/процедур|заявлен|исак/i.test(hay)) return "procedure";
  if (/схем|субсид|плащан|бисс/i.test(hay)) return "scheme";
  return "regulation";
}

/**
 * Форматира резултатите във формат подходящ за system prompt.
 * Структурата е същата като в досегашния `getKnowledgeContext`,
 * за да остане съвместимост в чата.
 */
export function formatRetrievedContext(items: RetrievedItem[]): string {
  if (!items.length) return "";
  const typeLabel: Record<string, string> = {
    scheme: "схема/субсидия",
    regulation: "наредба/закон",
    procedure: "процедура",
    deadline: "срок",
  };
  return items
    .map((item, i) => {
      const docType = inferDocTypeFromRetrieved(item);
      const meta: string[] = [
        `Тип: ${typeLabel[docType] ?? docType}`,
        `Произход: ${item.source_type ?? "kb"}`,
      ];
      if (item.category) meta.push(`Категория: ${item.category}`);
      if (item.source_name) meta.push(`Източник: ${item.source_name}`);
      if (item.effective_date) meta.push(`В сила от: ${item.effective_date}`);
      if (item.similarity !== undefined) {
        meta.push(`Сходство: ${item.similarity.toFixed(2)}`);
      }
      return `[#${i + 1}] === ${item.title} ===
${meta.join(" | ")}

${item.content.trim()}`;
    })
    .join("\n\n---\n\n");
}

/** Удобно: едновременно retrieve + format. */
export async function getRagContext(query: string): Promise<{
  context: string;
  items: RetrievedItem[];
  usedVector: boolean;
}> {
  const items = await hybridRetrieve(query);
  const usedVector = items.some((i) => i.origin !== "lexical");
  return {
    context: formatRetrievedContext(items),
    items,
    usedVector,
  };
}
