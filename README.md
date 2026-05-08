# AgriNexus.Law MVP 1.0 🌾

**Production-ready** AI платформа за български фермери. Три специалиста — Елена (право/ДФЗ), Борис (култури и почва), Виктория (финанси и сметки).

## Бърз старт

1. Прочетете `DEPLOYMENT-GUIDE.md` за подробни инструкции
2. Регистрирайте се в OpenAI, Supabase, Resend (всички с безплатен старт)
3. Изпълнете `supabase-setup.sql` в Supabase SQL Editor
4. `npm install` и `npm run dev`
5. Push в GitHub, deploy на Vercel

## Структура

```
agrinexus-mvp/
├── app/
│   ├── api/
│   │   ├── chat/         # Chat с RAG
│   │   ├── waitlist/     # Регистрация + имейл
│   │   └── search/       # Търсачка
│   ├── profile/          # Профил на стопанството
│   ├── search/           # Търсачка UI
│   ├── privacy/          # Privacy Policy
│   ├── terms/            # Terms of Service
│   └── page.tsx          # Главна страница
├── lib/
│   ├── characters.ts     # Тримата персонажа
│   ├── knowledge/
│   │   └── dfz-knowledge.ts  # ДФЗ knowledge база
│   ├── supabase.ts       # Database client
│   └── utils/
│       └── rate-limit.ts # Защита от abuse
├── supabase-setup.sql    # SQL скрипт за DB
└── DEPLOYMENT-GUIDE.md   # Пълно ръководство
```

## Какво включва

- **3 AI персонажа** с различни личности и експертизи
- **ДФЗ Knowledge базата** с 12+ структурирани документа за основните схеми
- **RAG (pgvector + BM25 hybrid)** — semantic search в Supabase + lexical fallback, обединени с RRF
- **Профил на стопанството** - персонализирани отговори
- **Базова търсачка** с филтри по категории
- **Supabase интеграция** за waitlist и chat logs
- **Resend имейли** с професионални welcome съобщения
- **Rate limiting** срещу abuse
- **Mobile responsive** дизайн
- **GDPR compliance** - Privacy Policy на български

## RAG (Retrieval-Augmented Generation)

Чатът използва hybrid retrieval — за всеки въпрос:

1. **Lexical (BM25)** — `lib/knowledge/internal-ai-search.ts` ранкира статичните `KNOWLEDGE_BASE` документи.
2. **Vector (pgvector)** — `lib/rag/vector-search.ts` извиква `match_knowledge_chunks` RPC в Supabase със `text-embedding-3-small` embeddings.
3. **Reciprocal Rank Fusion** — `lib/rag/hybrid-search.ts` комбинира двата списъка и връща топ-N най-релевантни парчета.
4. Резултатът се добавя към `system prompt` преди заявката към OpenAI.

Ако RAG не е активиран (липсва `OPENAI_API_KEY` или `SUPABASE_SERVICE_ROLE_KEY`), системата автоматично използва само BM25 — без чупене на чата.

### Setup

```bash
# 1. Изпълни supabase-rag-setup.sql в Supabase SQL Editor (активира pgvector + създава knowledge_chunks)
# 2. Сложи OPENAI_API_KEY, SUPABASE_*  и INGEST_ADMIN_TOKEN в .env.local
# 3. Стартирай dev сървъра
npm run dev

# 4. Първоначално индексиране (генерира embeddings за всички KNOWLEDGE_BASE + learned + public_documents):
curl -X POST http://localhost:3002/api/rag/reindex \
  -H "x-ingest-token: <INGEST_ADMIN_TOKEN>" \
  -H "content-type: application/json" \
  -d '{"target":"all"}'
```

### Reindex таргети

- `all` — всички източници (по подразбиране)
- `static` — само `lib/knowledge/dfz-knowledge*.ts`
- `learned` — `knowledge_learned_items` (от feedback loop)
- `public_documents` — заглавия на нормативни документи (от ingest pipeline)

Reindex е **idempotent** — chunks с непроменено съдържание (`content_hash`) се пропускат.

## Технологичен stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- OpenAI (по подразбиране: gpt-4o-mini)
- Supabase PostgreSQL
- Resend Email
- Upstash Redis
- Vercel Hosting + Analytics

## Лиценз

Proprietary - Всички права запазени AgriNexus.Law 2025

## Контакт

За въпроси: hello@agrinexus.bg
