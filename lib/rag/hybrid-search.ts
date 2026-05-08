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

  return Array.from(fused.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, finalTopK);
}

/**
 * Форматира резултатите във формат подходящ за system prompt.
 * Структурата е същата като в досегашния `getKnowledgeContext`,
 * за да остане съвместимост в чата.
 */
export function formatRetrievedContext(items: RetrievedItem[]): string {
  if (!items.length) return "";
  return items
    .map((item, i) => {
      const meta: string[] = [];
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
