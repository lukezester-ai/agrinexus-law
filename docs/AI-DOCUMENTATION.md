# AI документация — AgriNexus MVP

Ръководство за разработчици и оператори: LLM, RAG, API, променливи на средата и проверки.

**Стратегия и „защо OpenAI“:** виж **`docs/AI-SYSTEM.md`** (основен LLM доставчик, voice/vision/agents/multimodal като продуктова посока).

**RAG (документи, PDF, LlamaIndex в Python):** виж **`docs/RAG-SYSTEM.md`**.

## Стек

| Компонент | Технология |
|-----------|------------|
| Чат LLM | OpenAI през Vercel AI SDK (`@ai-sdk/openai`, `streamText`) |
| Модел по подразбиране | `gpt-4o-mini` (override: `OPENAI_MODEL`) |
| Embeddings | `text-embedding-3-small`, 1536 dim (`OPENAI_EMBEDDING_MODEL`) |
| Векторно DB | Supabase + pgvector (`knowledge_chunks`) |
| Lexical търсене | Вътрешно + **Typesense** (видеа/PDF/уроци, приоритет) + опционално Meilisearch за `/api/search` — виж `docs/SEARCH-SYSTEM.md` |
| Rate limits | Upstash Redis (чат, търсене) |

## Променливи на средата (основни)

Копирайте от `.env.example`. Секретите са в `.env.local` (не се комитират).

| Променлива | Назначение |
|------------|------------|
| `OPENAI_API_KEY` | Задължителен за чат и embeddings |
| `OPENAI_MODEL` | Опционален override на чат модела |
| `OPENAI_EMBEDDING_MODEL` | Опционален override на embedding модела |
| `RAG_ENABLED` | `0` изключва vector частта (логика в `lib/rag/config.ts`) |
| `RAG_MATCH_THRESHOLD`, `RAG_VECTOR_TOP_K`, `RAG_LEXICAL_TOP_K`, `RAG_FINAL_TOP_K` | Fine-tuning на retrieval |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | RAG индекс, learned knowledge, логове |
| `TYPESENSE_*` | Typesense за публично търсене в обучително съдържание (виж `lib/typesense.ts`, `docs/SEARCH-SYSTEM.md`) |
| `MEILI_*` | Meilisearch — fallback лексикален слой (виж `lib/meilisearch.ts`) |
| `INGEST_ADMIN_TOKEN` | Защита на `/api/ingest/run`, `/api/ingest/upload`, `/api/rag/reindex` |

Пълен списък и deploy стъпки: `DEPLOYMENT-GUIDE.md`.

## HTTP API (AI-свързани)

| Маршрут | Метод | Описание |
|---------|-------|----------|
| `/api/chat` | POST | Стриймван чат; използва AI лидера за контекст → OpenAI |
| `/api/chat-feedback` | POST | Обратна връзка (учене / логове) |
| `/api/search` | POST | Търсене: Typesense → Meilisearch → merge с ДФЗ база + learned + public docs |
| `/api/rag/reindex` | POST | Преиндексиране (админ токен) |
| `/api/rag/dryrun` | POST/GET | Оценка на reindex без пълно изпълнение |
| `/api/ingest/run` | POST | Ingest pipeline |
| `/api/ingest/upload` | POST | Качване на PDF → chunks + embeddings (**админ токен**, като при reindex) |
| `/api/stats/live` | GET | Публични метрики, включително RAG health |

## NPM скриптове

```bash
npm run typecheck    # TypeScript
npm run lint:ci      # ESLint без warnings
npm run build        # Production build
npm run check:rag    # Health на RAG индекса (URL от env)
npm run check:rag:local
npm run reindex      # През HTTP /api/rag/reindex
npm run reindex:direct
```

## AI лидер (оркестрация)

### Чат (retrieval за LLM)

Детайлна диаграма: **`docs/AI-LEADER-ARCHITECTURE.md`** (раздел по-долу).  
Код: `lib/ai-leader/chat-knowledge-pipeline.ts` — **`runChatKnowledgePipeline`**.

### Ingest и RAG reindex (индексиране)

| Функция | Файл | Описание |
|---------|------|----------|
| `isIngestAdminAuthorized` | `lib/ai-leader/admin-ingest-auth.ts` | Единна проверка на `INGEST_ADMIN_TOKEN` (header `x-ingest-token` или `Authorization: Bearer …`) |
| `runIngestOrchestration` | `lib/ai-leader/ingest-reindex-pipeline.ts` | `mode: "web"` → web discover + LLM подбор; иначе → `runDocumentIngest` по източници |
| `runReindexOrchestration` | същият файл | `target`: `all` \| `static` \| `learned` \| `public_documents` \| `public_doc_content` |
| `getReindexOrchestrationUsageDocs` | същият файл | JSON за GET `/api/rag/reindex` (usage) |

Импорт от приложението: `@/lib/ai-leader` (реекспорти в `lib/ai-leader/index.ts`).

## RAG pipeline (ингест)

1. **Парсване:** PDF, DOCX, HTML, OCR — `lib/rag/content/*`
2. **Chunking:** `lib/rag/chunker.ts` + `lib/rag/config.ts`
3. **Embeddings:** `lib/rag/embeddings.ts`
4. **Запис:** `lib/rag/reindex.ts` и свързани API
5. **Retrieval:** `lib/rag/hybrid-search.ts` (RRF), `lib/rag/vector-search.ts`

## Често срещани проблеми

| Симптом | Проверка |
|---------|----------|
| 401 от `/api/ingest/upload` или reindex | Задайте `INGEST_ADMIN_TOKEN` и подайте същия токен като `x-ingest-token` или `Authorization: Bearer …` |
| 503 от `/api/chat` за API key | `OPENAI_API_KEY` в `.env.local`, не примерна стойност |
| RAG винаги BM25 | `RAG_ENABLED`, Supabase ключове, chunks с non-null `embedding` |
| Празен контекст | `npm run check:rag:local`, после `reindex` |
| Грешен embedding размер | Колоната в БД трябва да съвпада с `embeddingDimensions` в `lib/rag/config.ts` |

## Вътрешни отговори без OpenAI

Някои персонажи/сценарии използват `tryInternalCharacterReply` — отговор от вътрешна база без LLM; вижте `lib/chat-internal.ts` и `CHARACTERS` в `lib/characters.ts`.
