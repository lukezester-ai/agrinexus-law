/**
 * Централна конфигурация за RAG слоя.
 * Един файл, за да не се размазват „magic numbers" из кода.
 */

export const RAG_CONFIG = {
  /** OpenAI embedding модел. text-embedding-3-small = 1536 dim. */
  embeddingModel:
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",

  /** Размерност на вектора. ВАЖНО: трябва да съответства на колоната vector(1536) в SQL. */
  embeddingDimensions: 1536,

  /** Максимум символи на chunk (приблизително ~250-350 токена). */
  chunkSize: 1200,

  /** Припокриване между съседни chunks (за да не се „реже" контекст по средата). */
  chunkOverlap: 150,

  /** Минимална similarity (0..1) за да се включи chunk в контекста. */
  matchThreshold: Number.parseFloat(process.env.RAG_MATCH_THRESHOLD || "0.3"),

  /** Брой chunks от vector search. */
  vectorTopK: Number.parseInt(process.env.RAG_VECTOR_TOP_K || "8", 10),

  /** Брой документи от BM25 (lexical) търсене. */
  lexicalTopK: Number.parseInt(process.env.RAG_LEXICAL_TOP_K || "8", 10),

  /** Финален брой chunks/документи в prompt контекста. */
  finalTopK: Number.parseInt(process.env.RAG_FINAL_TOP_K || "6", 10),

  /** RRF (Reciprocal Rank Fusion) константа. */
  rrfK: 60,

  /** Batch размер при подаване на embeddings към OpenAI. */
  embeddingBatchSize: 64,

  /** RAG може да се изключи глобално (връща се към BM25-само). */
  enabled: (process.env.RAG_ENABLED || "1") !== "0",
} as const;

export function isRagEnabled(): boolean {
  if (!RAG_CONFIG.enabled) return false;
  if (!process.env.OPENAI_API_KEY?.trim()) return false;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return false;
  if (
    !process.env.SUPABASE_URL?.trim() &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  ) {
    return false;
  }
  return true;
}
