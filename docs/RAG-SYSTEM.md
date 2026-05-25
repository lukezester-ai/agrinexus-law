# RAG система · AgriNexus MVP

**Цел:** AI да **чете документи** (вкл. PDF), да **учи от индексирани текстове** (наръчници, наредби, книги след ingest) и да **отговаря с опора върху извлечен контекст**, а не „на сляпо“.

## Какво позволява в продуктов смисъл

| Възможност | Как се постига в проекта |
|------------|-------------------------|
| **AI чете PDF** | Извличане на текст (`lib/rag/content/pdf-parser.ts`), при нужда OCR за сканирани PDF (`lib/rag/content/ocr.ts`, env `RAG_OCR_*`) → chunk → embedding → запис в **`knowledge_chunks`**. |
| **AI учи от „книги“ / дълги текстове** | Същият pipeline: ingest/reindex качва съдържанието като chunks; нови версии се преиндексират. |
| **Отговори по документи** | При чат: `runChatKnowledgePipeline` сглобява контекст → влиза в system prompt с правила за цитиране (`lib/characters.ts` — RAG блок) → OpenAI генерира отговор. |

## Поток днес (Next.js / TypeScript)

1. **Индексиране:** PDF/DOCX/HTML → chunk (`lib/rag/chunker.ts`) → OpenAI embeddings (`lib/rag/embeddings.ts`) → Supabase **pgvector** (`lib/rag/reindex.ts`, API за ingest).
2. **Retrieval при въпрос:** хибрид **vector + lexical** + RRF (`lib/rag/hybrid-search.ts`), конфиг `lib/rag/config.ts`.
3. **Оркестрация за чат:** `lib/ai-leader/chat-knowledge-pipeline.ts` — RAG → fallback към статична ДФЗ база → learned knowledge → Furrow snapshot.
4. **LLM:** OpenAI през `app/api/chat/route.ts` (виж `docs/AI-SYSTEM.md`).

## LlamaIndex (препоръка за Python „мозъка“)

**LlamaIndex** е подходящ за **напреднал RAG** в **`services/agrinexus-brain/`** (FastAPI): готови абстракции за индекси, query engines, **router** между източници, sub-question decomposition, синтез на отговори и по-лесен експеримент с eval.

| Защо LlamaIndex до TS RAG | Обяснение |
|--------------------------|-----------|
| **Екосистема** | Много интеграции (Postgres/pgvector, OpenAI, PDF loaders, observability). |
| **Сложни пайплайни** | Агенти, multi-step retrieval, metadata filters — по-малко boilerplate от „ръчен“ RRF. |
| **Съвместимост** | Може да чете/пише в **същата** Supabase схема или паралелен индекс; Next остава BFF, Python връща контекст + цитати към фронта. |

**Важно:** production чатът днес **не** изисква LlamaIndex — той е **опционален** следващ слой във FastAPI, ако искате да пренесете част от `lib/rag/*` към Python без да чупите текущия deploy.

### Инсталация (опционално, в `agrinexus-brain`)

```bash
cd services/agrinexus-brain
pip install -r requirements-rag.txt
```

Файлът `requirements-rag.txt` съдържа LlamaIndex + OpenAI + Postgres vector интеграции (инсталирайте само когато започнете Python RAG).

## Променливи (кратко)

| Променлива | Значение |
|------------|----------|
| `RAG_ENABLED` | `0` изключва vector частта. |
| `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL` | Embeddings и качество на retrieval. |
| `RAG_MATCH_THRESHOLD`, `RAG_VECTOR_TOP_K`, … | Fine-tuning — `lib/rag/config.ts`. |
| `RAG_OCR_ENABLED` | OCR за сканирани PDF. |

Пълен списък: `docs/AI-DOCUMENTATION.md`.

## Свързани документи

- `docs/AI-DOCUMENTATION.md` — API маршрути, env, troubleshooting.
- `docs/AI-LEADER-ARCHITECTURE.md` — AI лидер и ingest/reindex.
- `docs/BACKEND-ARCHITECTURE.md` — FastAPI като дом за LlamaIndex.
- `docs/AI-SYSTEM.md` — OpenAI като LLM доставчик.
