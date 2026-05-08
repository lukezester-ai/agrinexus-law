-- AgriNexus.Law - RAG (Retrieval-Augmented Generation) setup
-- Изпълнете този скрипт в Supabase SQL Editor СЛЕД supabase-setup.sql.
--
-- Какво включва:
--   * Активиране на pgvector
--   * Таблица `knowledge_chunks` за нарязани документи + embeddings
--   * HNSW индекс за векторно търсене (cosine)
--   * RPC `match_knowledge_chunks` за semantic search
--   * RLS policy: само service_role може да чете/пише

-- ─────────────────────────────────────────────────────────────────────
-- 1. Extension
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Таблица knowledge_chunks
-- ─────────────────────────────────────────────────────────────────────
-- source_type:
--   'static'           - chunk от lib/knowledge/dfz-knowledge*.ts
--   'public_document'  - chunk от ingest pipeline (public_documents)
--   'learned'          - chunk от knowledge_learned_items
-- source_id:           - ID на оригиналния документ (string, slug или uuid)
-- content_hash:        - SHA-256 на (source_id + chunk_index + content) за dedup
-- embedding:           - vector(1536) за text-embedding-3-small

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('static', 'public_document', 'learned')),
  source_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT,
  doc_type TEXT,
  source_name TEXT,
  effective_date DATE,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
  ON knowledge_chunks (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_category
  ON knowledge_chunks (category);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_hash
  ON knowledge_chunks (content_hash);

-- HNSW индекс за бърз cosine similarity search.
-- За малки бази (<10k chunks) IVFFLAT също работи, но HNSW е по-бърз без warm-up.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─────────────────────────────────────────────────────────────────────
-- 3. RPC: similarity search
-- ─────────────────────────────────────────────────────────────────────
-- Връща chunks подредени по cosine similarity.
-- match_threshold: минимум similarity (0..1, обикновено 0.5..0.7)
-- match_count: max брой резултати
-- p_source_types: optional масив (NULL = всички)

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 8,
  p_source_types TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  chunk_index INTEGER,
  title TEXT,
  category TEXT,
  doc_type TEXT,
  source_name TEXT,
  effective_date DATE,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.chunk_index,
    kc.title,
    kc.category,
    kc.doc_type,
    kc.source_name,
    kc.effective_date,
    kc.content,
    kc.metadata,
    (1 - (kc.embedding <=> query_embedding))::float AS similarity
  FROM knowledge_chunks kc
  WHERE
    kc.embedding IS NOT NULL
    AND (p_source_types IS NULL OR kc.source_type = ANY(p_source_types))
    AND (p_category IS NULL OR kc.category = p_category)
    AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "Service role full access knowledge_chunks"
  ON knowledge_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- (опционално) public read - ако искаш chunks да се четат без service key:
-- DROP POLICY IF EXISTS "Public read knowledge_chunks" ON knowledge_chunks;
-- CREATE POLICY "Public read knowledge_chunks"
--   ON knowledge_chunks FOR SELECT
--   USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Полезни заявки
-- ─────────────────────────────────────────────────────────────────────
-- Брой chunks по тип:
-- SELECT source_type, COUNT(*) FROM knowledge_chunks GROUP BY source_type;
--
-- Chunks без embedding (нуждаят се от reindex):
-- SELECT source_type, source_id, chunk_index FROM knowledge_chunks WHERE embedding IS NULL;
--
-- Изтриване на всички static chunks (преди пълен reindex):
-- DELETE FROM knowledge_chunks WHERE source_type = 'static';
