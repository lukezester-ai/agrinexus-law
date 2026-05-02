-- AgriNexus.Law MVP 1.0 - SQL setup за Supabase
-- Изпълнете този скрипт в Supabase SQL Editor

-- 1. Waitlist таблица за регистрации
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  farm_type TEXT,
  farm_size INTEGER,
  region TEXT,
  ip_address TEXT,
  source TEXT DEFAULT 'landing',
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);

-- 2. Chat logs за анализ и подобрение
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

-- 3. Search queries за анализ какво търсят потребителите
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

-- 4. Row Level Security
-- За production използвайте по-строги политики

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Service role може да прави всичко (за API routes)
CREATE POLICY "Service role full access waitlist" 
  ON waitlist FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access chat_logs" 
  ON chat_logs FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access search_queries" 
  ON search_queries FOR ALL 
  USING (auth.role() = 'service_role');

-- Полезни заявки за анализ
-- Брой регистрации по дни
-- SELECT DATE(created_at) as day, COUNT(*) as registrations
-- FROM waitlist GROUP BY day ORDER BY day DESC;

-- Най-популярни въпроси по персонаж
-- SELECT character_id, user_message, COUNT(*) as count
-- FROM chat_logs GROUP BY character_id, user_message
-- ORDER BY count DESC LIMIT 20;

-- Брой разговори по персонаж
-- SELECT character_id, COUNT(*) as conversations
-- FROM chat_logs GROUP BY character_id;

-- ─── Supabase Auth (вход за „Моя ферма“) ───
-- В Dashboard → Authentication → URL configuration задайте:
--   Site URL: https://вашият-домейн.com (локално: http://localhost:3002)
--   Redirect URLs: https://вашият-домейн.com/auth/callback , http://localhost:3002/auth/callback
-- Включете Email provider (Magic Link). Сервизният ключ остава само на сървъра.

-- ─── Документи на фермери (Supabase Storage + таблица по user_id) ───
-- Изпълнете след като Auth е активен. Bucket-ът е частен; достъп само за собственика.

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
