-- AgriNexus.Law MVP 1.0 - SQL setup за Supabase
-- Изпълнете този скрипт в Supabase SQL Editor
-- (waitlist и magic link вход са премахнати от приложението — стари таблици може да оставите или DROP ръчно.)

-- 1. Chat logs за анализ и подобрение
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  character_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  ip_address TEXT,
  user_profile JSONB,
  feedback INTEGER, -- 1 = thumbs up, -1 = thumbs down
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_character ON chat_logs(character_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs(created_at DESC);

-- 2. Search queries за анализ какво търсят потребителите
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  category TEXT,
  results_count INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_created ON search_queries(created_at DESC);

-- 3. Row Level Security
-- За production използвайте по-строги политики

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Service role може да прави всичко (за API routes)
CREATE POLICY "Service role full access chat_logs" 
  ON chat_logs FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access search_queries" 
  ON search_queries FOR ALL 
  USING (auth.role() = 'service_role');

-- Полезни заявки за анализ
-- SELECT character_id, user_message, COUNT(*) as count
-- FROM chat_logs GROUP BY character_id, user_message
-- ORDER BY count DESC LIMIT 20;

-- Брой разговори по персонаж
-- SELECT character_id, COUNT(*) as conversations
-- FROM chat_logs GROUP BY character_id;

-- ─── Опционално: документи в облак по user_id (ако по-късно се върне Auth) ───

CREATE TABLE IF NOT EXISTS farmer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0 AND byte_size <= 26214400),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_documents_user ON farmer_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_documents_created ON farmer_documents(created_at DESC);

ALTER TABLE farmer_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own farmer_documents" ON farmer_documents;
CREATE POLICY "Users select own farmer_documents"
  ON farmer_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own farmer_documents" ON farmer_documents;
CREATE POLICY "Users insert own farmer_documents"
  ON farmer_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own farmer_documents" ON farmer_documents;
CREATE POLICY "Users delete own farmer_documents"
  ON farmer_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('farmer-docs', 'farmer-docs', false, 26214400)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "farmer_docs_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "farmer_docs_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "farmer_docs_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "farmer_docs_storage_update" ON storage.objects;

CREATE POLICY "farmer_docs_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'farmer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "farmer_docs_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'farmer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "farmer_docs_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'farmer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "farmer_docs_storage_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'farmer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'farmer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Публичен архив на нормативни документи (ingest pipeline) ───

CREATE TABLE IF NOT EXISTS public_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Нормативни актове',
  doc_type TEXT NOT NULL DEFAULT 'regulation',
  status TEXT NOT NULL DEFAULT 'active',
  source_url TEXT NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  effective_date DATE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_documents_institution ON public_documents(institution);
CREATE INDEX IF NOT EXISTS idx_public_documents_effective_date ON public_documents(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_public_documents_last_synced ON public_documents(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_documents_hash ON public_documents(content_hash);

CREATE TABLE IF NOT EXISTS ingest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  status TEXT NOT NULL,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  stored_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingest_runs_started ON ingest_runs(started_at DESC);

ALTER TABLE public_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access public_documents" ON public_documents;
CREATE POLICY "Service role full access public_documents"
  ON public_documents FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access ingest_runs" ON ingest_runs;
CREATE POLICY "Service role full access ingest_runs"
  ON ingest_runs FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public read public_documents" ON public_documents;
CREATE POLICY "Public read public_documents"
  ON public_documents FOR SELECT
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('agro-docs', 'agro-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ─── Самообучение от чат обратна връзка ───
CREATE TABLE IF NOT EXISTS knowledge_learned_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_chat_log_id UUID UNIQUE REFERENCES chat_logs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Практически насоки',
  type TEXT NOT NULL DEFAULT 'learned_rule',
  content TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'User feedback loop',
  effective_date DATE DEFAULT CURRENT_DATE,
  quality_score NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_learned_items_active ON knowledge_learned_items(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_learned_items_category ON knowledge_learned_items(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_learned_items_created ON knowledge_learned_items(created_at DESC);

ALTER TABLE knowledge_learned_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access knowledge_learned_items" ON knowledge_learned_items;
CREATE POLICY "Service role full access knowledge_learned_items"
  ON knowledge_learned_items FOR ALL
  USING (auth.role() = 'service_role');
