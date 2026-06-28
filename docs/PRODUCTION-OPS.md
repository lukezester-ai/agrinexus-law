# Production ops — Billing, AI Leader, RAG, Admin

Единен наръчник за **live Stripe**, **Vercel cron (AI Leader)**, **Supabase миграции** и как работят **RAG**, **document-review** и **admin cockpit**.

---

## 0. Ред на миграциите (Supabase SQL Editor)

Изпълнете **на ред** (ако таблицата вече съществува, скриптът е idempotent):

| # | Файл | Какво създава |
|---|------|----------------|
| 1 | `supabase-setup.sql` | Auth profiles, chat_logs, базови таблици |
| 2 | `supabase-rag-setup.sql` | pgvector, `knowledge_chunks` |
| 3 | `supabase-billing.sql` | `user_subscriptions` (Stripe sync) |
| 4 | `supabase-document-reviews.sql` | AI преглед + case memory |
| 5 | `supabase-agent-runs.sql` | `agent_runs` — история на 5-те AI агента |

След SQL: redeploy на Vercel с пълните env променливи (§2).

---

## 1. Billing live (Stripe + Vercel)

### 1.1 Stripe Dashboard — продукти и цени

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Product catalog** → **Add product**
2. Създайте **2 продукта** (валута **EUR**):

| Продукт | Месечна цена | Годишна цена |
|---------|--------------|--------------|
| **AgriNexus Про** | €19.90 / month, recurring | €199 / year, recurring |
| **AgriNexus Стопанство** | €49 / month | €490 / year |

3. Запишете **Price ID**-тата (`price_1ABC...`) — по един за всеки интервал.

> Trial 7 дни се задава от кода при Checkout (`BILLING_TRIAL_DAYS`), не задължително в Stripe product.

### 1.2 Webhook endpoint

1. Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. **URL:** `https://www.agrinexuslaw.com/api/billing/webhook`
3. **Events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Копирайте **Signing secret** → `STRIPE_WEBHOOK_SECRET` (`whsec_...`)

За локален тест:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### 1.3 Vercel Environment Variables

Project → Settings → Environment Variables → **Production**:

| Variable | Стойност |
|----------|----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (или `sk_test_...` за тест) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` от webhook endpoint-а |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` |
| `STRIPE_PRICE_PRO_YEARLY` | `price_...` |
| `STRIPE_PRICE_STOPYANSTVO_MONTHLY` | `price_...` |
| `STRIPE_PRICE_STOPYANSTVO_YEARLY` | `price_...` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.agrinexuslaw.com` |
| `UPSTASH_REDIS_REST_URL` | Upstash URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token |

**Upstash** е нужен за дневни лимити на чат и месечни лимити на document-review. Без Redis плановете работят, но броенето на usage е по-слабо.

### 1.4 Проверка след deploy

1. `/ceni` — бутон „Абонирай се“ → Stripe Checkout (логнат потребител)
2. След плащане: Stripe webhook → `user_subscriptions` в Supabase
3. `GET /api/billing/subscription` — връща текущ план
4. Чат над лимита на free → HTTP **402** с `upgradeUrl: /ceni`

Локална проверка на env:
```bash
npx tsx scripts/check-production-env.ts
```
(заредете `.env.local` преди това или export-нете променливите)

### 1.5 Поток (billing)

```mermaid
flowchart LR
  User[/ceni] --> Checkout[POST /api/billing/checkout]
  Checkout --> Stripe[Stripe Checkout]
  Stripe --> WH[POST /api/billing/webhook]
  WH --> DB[(user_subscriptions)]
  Chat[/api/chat] --> Ent[entitlements]
  Ent --> DB
  Ent --> Redis[(Upstash usage)]
```

---

## 2. AI Leader в production (cron + SQL)

### 2.1 SQL

Изпълнете `supabase-agent-runs.sql` в Supabase. Таблица `agent_runs` пази метрики от всеки run.

### 2.2 Vercel Cron (`vercel.json`)

Repo-то включва:

| Schedule (UTC) | Path | Какво прави |
|----------------|------|-------------|
| `30 5 * * *` (ежедневно ~07:30 EET) | `/api/agents/cron?skipHeavy=1` | guardian + learner + analyst (без archive/indexer) |
| `0 3 * * 0` (неделя) | `/api/agents/cron` | пълен цикъл — всички 5 агента |

**Задължително в Vercel:**

| Variable | Описание |
|----------|----------|
| `CRON_SECRET` | Дълъг random string — Vercel изпраща `Authorization: Bearer <CRON_SECRET>` автоматично |

Генериране:
```bash
openssl rand -hex 32
```

> **Vercel Hobby:** cron jobs са ограничени; за production Pro е препоръчителен. Резерв: GitHub Action `.github/workflows/agents-cron.yml`.

### 2.3 GitHub Actions (резерв)

Secrets:
- `AGENTS_CRON_URL` = `https://www.agrinexuslaw.com/api/agents/cron?skipHeavy=1`
- `CRON_SECRET` = същата стойност като във Vercel

### 2.4 Ръчен тест

```bash
curl -sS -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://www.agrinexuslaw.com/api/agents/cron?skipHeavy=1"
```

Очакван отговор: JSON с `ok`, `runs[]`, `summary`.

Admin UI: `/admin` → секция **AI Leader — 5 агента** (изисква `INGEST_ADMIN_TOKEN`).

### 2.5 Петте агента

| ID | Име | Роля |
|----|-----|------|
| `guardian` | Пазител | Env, RAG, Supabase, Stripe |
| `archive` | Архивар | ДФЗ PDF → архив → RAG |
| `learner` | Учен | 👍 feedback → learned knowledge |
| `indexer` | Индексатор | Embeddings + Meili sync |
| `analyst` | Аналитик | Engagement метрики |

---

## 3. RAG — deep dive

### Какво прави

При всеки AI въпрос `runChatKnowledgePipeline` (`lib/ai-leader/chat-knowledge-pipeline.ts`):

1. **Hybrid RAG** — vector (pgvector) + lexical (BM25) → RRF merge
2. Fallback → статична **ДФЗ база** (`lib/knowledge/dfz-knowledge.ts`)
3. **Learned knowledge** от одобрен chat feedback
4. **Furrow markets** snapshot

Контекстът влиза в system prompt на Елена/Борис/Виктория (`lib/characters.ts`).

### Индексиране (offline)

```mermaid
flowchart TD
  PDF[PDF/DOCX/HTML] --> Parse[lib/rag/content/*]
  Parse --> Chunk[chunker.ts]
  Chunk --> Embed[embeddings OpenAI]
  Embed --> KC[(knowledge_chunks)]
  Admin[/admin upload] --> KC
  Ingest[/api/ingest/cron] --> KC
  Reindex[/api/rag/reindex] --> KC
```

**Ключови env:**
- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — задължителни за vector RAG
- `RAG_ENABLED=0` — изключва vector част (остава BM25)
- `RAG_OCR_ENABLED=1` — OCR за сканирани PDF

**Мониторинг:**
- `GET /api/health` — RAG chunk counts
- `GET /api/admin/diagnostics` — env flags + RAG hints
- `/admin/cockpit` — визуален dashboard

**Пълен документ:** `docs/RAG-SYSTEM.md`

---

## 4. Document Review — deep dive

### UI и API

- Страница: `/document-review`
- API: `POST /api/document-review/analyze` (multipart: `file`, `mode`, `context`)

### Режими (`ReviewMode`)

| mode | Тип документ |
|------|--------------|
| `subsidy` | Субсидии / ДФЗ |
| `contract` | Договор |
| `lease` | Аренда / наем |
| `notice` | Уведомление / писмо |

### Pipeline (`modules/law/document-review.ts`)

1. Extract text — PDF (`pdf-parser`), DOCX, TXT (max 10 MB upload)
2. LLM structured analysis — риск, срокове, checklist (gpt-4o-mini)
3. Optional persist — `supabase-document-reviews.sql` → case memory

### Billing gate

| План | Лимит |
|------|-------|
| free | 0 (изисква upgrade) |
| pro | 10 / месец |
| stopyanstvo | неограничено |

Изисква **login** + Redis за броене. HTTP 402/401 с `upgradeUrl: /ceni`.

---

## 5. Admin Cockpit — deep dive

### `/admin`

- PDF upload → `/api/ingest/upload`
- Document Archive Agent (ръчно)
- **AI Leader panel** — пускане на агенти с `INGEST_ADMIN_TOKEN`

### `/admin/cockpit`

Executive dashboard (server-rendered):
- Брой chat logs, public documents, document reviews, learned items
- Посещения (visit counter)
- RAG index status (chunks with/without embeddings)
- Readiness modules (AI Brain, Law, RAG, …)

### `/admin/diagnostics`

JSON API за CI/ops — env flags, RAG health, billing/cron configured.

### Auth

Admin ingest/agents използват `INGEST_ADMIN_TOKEN` (header `x-ingest-token` или `Authorization: Bearer`).

---

## 6. Checklist преди go-live

- [ ] Supabase SQL 1–5 изпълнени
- [ ] Vercel env: Supabase, OpenAI, Stripe (4 price IDs + webhook secret)
- [ ] `UPSTASH_REDIS_*` за usage limits
- [ ] `CRON_SECRET` + redeploy (activates `vercel.json` crons)
- [ ] `INGEST_ADMIN_TOKEN` за admin + ingest GitHub Action
- [ ] Stripe webhook → test event → `user_subscriptions` row
- [ ] `curl` agents cron → HTTP 200
- [ ] `/admin/cockpit` — RAG chunks > 0 (след ingest/reindex)

---

## Свързани файлове

| Файл | Роля |
|------|------|
| `vercel.json` | Vercel cron schedules |
| `.github/workflows/agents-cron.yml` | Резервен agents cron |
| `.github/workflows/ingest-cron.yml` | Document archive cron |
| `scripts/check-production-env.ts` | Env validation |
| `docs/AI-LEADER-ARCHITECTURE.md` | AI Leader детайли |
| `docs/RAG-SYSTEM.md` | RAG pipeline |
