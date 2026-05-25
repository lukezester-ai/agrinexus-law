# AI система · AgriNexus MVP

Това е **основният продуктов слой** за интелигентност: един доставчик на модели за текст, embeddings и бъдещи мултимодални възможности.

## Основен LLM доставчик: **OpenAI API**

**Избор:** платформата е изградена около **OpenAI** като единствен външен LLM за продукционен чат и векторни embeddings.

### Защо OpenAI (продуктова логика)

| Направление | Как помага на AgriNexus |
|-------------|-------------------------|
| **Качество на текст** | Силни модели за български + структурирани отговори (системни промптове, RAG контекст). |
| **Voice / реч** | Realtime API, TTS, STT — готов път за гласов асистент без смяна на доставчик. |
| **Vision** | Модели като `gpt-4o` приемат изображения — снимки от полето, сканирани документи, UI за прикачване. |
| **Agents / оркестрация** | Responses API, function calling, асистенти — за по-сложни многостъпкови задачи (срокове, чеклисти, инструменти). |
| **Multimodal** | Текст + изображение + (при нужда) аудио в един доставчик — по-малко фрагментация и по-лесен compliance. |

Текущият код използва **Vercel AI SDK** (`@ai-sdk/openai`, `streamText`) към OpenAI — стандартен път за Next.js и стрийминг.

## Какво е имплементирано днес

| Функция | Реализация |
|---------|------------|
| Чат (стрийм) | `app/api/chat/route.ts` → `createOpenAI` + `streamText`, модел по подразбиране `gpt-4o-mini` (`OPENAI_MODEL`). |
| RAG за чат | `lib/ai-leader/chat-knowledge-pipeline.ts` — контекст към system prompt → OpenAI. |
| Embeddings / индекс | `lib/rag/embeddings.ts` — `text-embedding-3-small` (или `OPENAI_EMBEDDING_MODEL`). |
| Web ingest подбор | `lib/ingest/web-agri-discover.ts` — OpenAI за избор на документи от резултати. |
| Без LLM (рядко) | `lib/chat-internal.ts` — кратки шаблонни отговори от вътрешна база; не замества OpenAI като основен път. |

## Променливи (минимум)

- **`OPENAI_API_KEY`** — задължителен за чат и embeddings.  
- **`OPENAI_MODEL`** — опционален; за **vision** в бъдеще типично `gpt-4o` или по-нов еквивалент.  
- **`OPENAI_EMBEDDING_MODEL`** — опционален override на embedding модела.

Пълен списък: `docs/AI-DOCUMENTATION.md` и `.env.example`.

## Какво е „следваща стъпка“ (не е задължително в MVP)

- UI за **снимка/скан** към чат → multimodal съобщения към същия OpenAI маршрут.  
- **Глас**: Realtime или STT+TTS към същия ключ и политики за логове.  
- **Agents**: отделни инструменти (търсене, календар) през function calling — същият доставчик.

## Свързани документи

- **`docs/RAG-SYSTEM.md`** — RAG по документи (PDF, книги), LlamaIndex в Python слоя.  
- **`docs/AI-DOCUMENTATION.md`** — API, env, RAG, troubleshooting.  
- **`docs/AI-LEADER-ARCHITECTURE.md`** — оркестрация на контекста преди LLM.
