# AI лидер — архитектура и автоматизация между звената

Този документ описва **оркестрацията** на AI компонентите в AgriNexus MVP: как отделните „звена“ се подреждат, кога се включват fallback-и и къде е единната точка в кода.

## Какво е „AI лидерът“

**AI лидерът** е слой, който **автоматизира реда и fallback логиката** между:

| Звено | Роля |
|--------|------|
| **RAG hybrid** | Vector (Supabase `knowledge_chunks` + embeddings) + lexical (BM25/RRF) чрез `getRagContext` |
| **Статична ДФЗ база** | Lexical контекст от `getKnowledgeContext`, ако RAG не даде текст |
| **Learned knowledge** | Допълнителен контекст от Supabase (`getLearnedKnowledgeContext`) |
| **Furrow snapshot** | Локален JSON (`furrow-knowledge.json`) през `getFurrowMarketsData` |

Единната функция в код: **`runChatKnowledgePipeline`** в `lib/ai-leader/chat-knowledge-pipeline.ts`.  
`app/api/chat/route.ts` я извиква преди да се построи system prompt и да се стриймне отговорът от OpenAI.

## Последователност (автоматизация)

```mermaid
flowchart TD
  Q[Потребителска заявка] --> RAG{RAG enabled?}
  RAG -->|да| TRY[getRagContext]
  TRY -->|успех| CTX[Първичен knowledge текст]
  TRY -->|грешка| DFZ
  RAG -->|не| DFZ[getKnowledgeContext]
  CTX --> EMPTY{Текст празен?}
  EMPTY -->|да| DFZ
  EMPTY -->|не| LEARN
  DFZ --> LEARN[getLearnedKnowledgeContext]
  LEARN --> FUR[getFurrowMarketsData]
  FUR --> JOIN[Обединяване с double newline]
  JOIN --> PROMPT[buildSystemPrompt + LLM]
```

- **Retrieval mode** за заглавките `X-Retrieval-Mode` / логове: `rag_hybrid` (има vector принос), `bm25` (само lexical/RAG без vector или статична база), `none` (няма retrieval текст преди learned/furrow).

## AI лидер — Ingest и RAG reindex

Отделен pipeline от чата: **индексиране и админ операции**, не streaming към потребителя.

| Звено | Функция / вход |
|--------|------------------|
| **Админ auth** | `isIngestAdminAuthorized` — един токен за `/api/ingest/run`, `/api/ingest/upload`, `/api/rag/reindex` |
| **Document / web ingest** | `runIngestOrchestration` — тяло като досегашния POST към `/api/ingest/run` |
| **Reindex по източник** | `runReindexOrchestration` + `parseReindexTarget` — същите `target` стойности като в `/api/rag/reindex` |

```mermaid
flowchart LR
  A[POST + INGEST_ADMIN_TOKEN] --> B{маршрут}
  B -->|/api/ingest/run| I[runIngestOrchestration]
  B -->|/api/ingest/upload| U[PDF → chunks → embed → knowledge_chunks]
  B -->|/api/rag/reindex| R[runReindexOrchestration]
  I --> S[(Supabase public_documents / ingest_runs)]
  U --> S
  R --> K[(knowledge_chunks)]
```

## Разширяване

1. Добавяне на ново звено: разширете `runChatKnowledgePipeline` и документирайте реда тук.
2. Нови API маршрути, които трябва същия **чат** контекст: импортирайте `runChatKnowledgePipeline` от `@/lib/ai-leader` вместо да копирате логика.
3. Нови **ingest/reindex** стъпки: разширете `lib/ai-leader/ingest-reindex-pipeline.ts` и тествайте през съществуващите API или скриптове в `scripts/`.

## Свързани файлове

- `lib/ai-leader/chat-knowledge-pipeline.ts` — оркестрация за чат
- `lib/ai-leader/admin-ingest-auth.ts` — админ токен за ingest / upload / reindex
- `lib/ai-leader/ingest-reindex-pipeline.ts` — `runIngestOrchestration`, `runReindexOrchestration`
- `lib/ai-leader/index.ts` — реекспорт
- `lib/rag/hybrid-search.ts` — RRF + hybrid retrieval
- `lib/rag/config.ts` — прагове, embedding модел, `RAG_ENABLED`
