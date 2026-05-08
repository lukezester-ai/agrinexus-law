import { getSupabaseAdmin } from "@/lib/supabase";
import { embedText } from "@/lib/rag/embeddings";
import { RAG_CONFIG } from "@/lib/rag/config";

export type ChunkSourceType = "static" | "public_document" | "learned";

export interface MatchedChunk {
  id: string;
  source_type: ChunkSourceType;
  source_id: string;
  chunk_index: number;
  title: string;
  category: string | null;
  doc_type: string | null;
  source_name: string | null;
  effective_date: string | null;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface VectorSearchOptions {
  topK?: number;
  threshold?: number;
  sourceTypes?: ChunkSourceType[];
  category?: string;
}

/**
 * Семантично търсене в `knowledge_chunks` чрез pgvector.
 * Връща празен масив, ако RAG не е конфигуриран — извикващият код
 * трябва да направи fallback към лексикално търсене (BM25).
 */
export async function vectorSearchChunks(
  query: string,
  options?: VectorSearchOptions,
): Promise<MatchedChunk[]> {
  const q = (query || "").trim();
  if (!q) return [];

  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(q);
  } catch (err) {
    console.error("vectorSearchChunks: embed failed:", err);
    return [];
  }

  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: queryEmbedding as unknown as string,
    match_threshold: options?.threshold ?? RAG_CONFIG.matchThreshold,
    match_count: options?.topK ?? RAG_CONFIG.vectorTopK,
    p_source_types: options?.sourceTypes ?? null,
    p_category: options?.category ?? null,
  });

  if (error) {
    console.error("vectorSearchChunks RPC error:", error.message);
    return [];
  }
  if (!data || !Array.isArray(data)) return [];

  return data.map((row) => ({
    id: row.id as string,
    source_type: row.source_type as ChunkSourceType,
    source_id: row.source_id as string,
    chunk_index: row.chunk_index as number,
    title: row.title as string,
    category: (row.category as string | null) ?? null,
    doc_type: (row.doc_type as string | null) ?? null,
    source_name: (row.source_name as string | null) ?? null,
    effective_date: (row.effective_date as string | null) ?? null,
    content: row.content as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    similarity: Number(row.similarity ?? 0),
  }));
}
