# Планиран ingest през GitHub Actions

Сървърът излага **`GET /api/ingest/cron`** — същият ingest като при `POST /api/ingest/run` (ДФЗ/МЗХ sitemap и т.н.), но удобен за **външен ping** (без Vercel Cron / без платен план).

## Два header-а — какво значат

| Header | Кога да го ползваш |
|--------|---------------------|
| **`x-ingest-token`** | Стойността трябва да е **точно** променливата **`INGEST_ADMIN_TOKEN`** от средата на Next (Vercel Env). Същото като при ръчен `POST /api/ingest/upload` или `POST /api/rag/reindex`. **Това е най-простият вариант за GitHub Actions.** |
| **`x-ingest-cron-token`** | Ползва се **само ако** на сървъра си задал **отделна** променлива **`INGEST_CRON_TOKEN`**. Тогава ping-ът може да праща този по-къс токен вместо пълния админ токен (по-малко права навсякъде). Ако **нямаш** `INGEST_CRON_TOKEN` във Vercel — **игнорирай** този header и ползвай само **`x-ingest-token`**. |

Освен това (по избор): **`Authorization: Bearer <CRON_SECRET>`** — ако ползваш Vercel Cron с `CRON_SECRET`; за GitHub Actions не ти трябва.

## Какъв е „дългият ключ“

- Това е **произволен секретен низ** — **не** е ограничен „само букви“ или „само цифри“.
- Препоръка: **дължина ≥ 32 знака**, ентропия от случайни байтове.
- Удобни примери за генериране:
  - **Само букви и цифри (hex):**  
    `openssl rand -hex 32` → 64 символа `[0-9a-f]`
  - **По-общо (букви, цифри, символи):**  
    `openssl rand -base64 32` (внимавай с кавички в `.env`)

Стойността на **`INGEST_ADMIN_TOKEN`** във Vercel и секретът **`INGEST_ADMIN_TOKEN`** в GitHub трябва да **съвпадат дума в дума** (без интервал в начал/край).

## GitHub: какво да зададеш

1. Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. **`INGEST_CRON_URL`** — пълен адрес. Примери:  
   - само сваляне: `https://ТВОЙ-ДОМЕЙН/api/ingest/cron?limit=8`  
   - сваляне + **RAG** (chunk/embed): добави `&reindex=1&reindexLimit=35`  
   Ако не искаш дълъг URL, във **Vercel** задай **`INGEST_CRON_AUTO_REINDEX=1`** (и опционално `INGEST_CRON_REINDEX_LIMIT`) — тогава същият `GET` без `reindex` в URL пак ще пусне reindex след ingest. **`?reindex=0`** го изключва изрично.
3. **`INGEST_ADMIN_TOKEN`** — същият низ като във Vercel за `INGEST_ADMIN_TOKEN`

Workflow файл: **`.github/workflows/ingest-cron.yml`** — по подразбиране **02:15 UTC** всеки ден + ръчно **Run workflow**.

## Локален тест

```bash
curl -sS -H "x-ingest-token: ТВОЙ_ТОКЕН" "http://localhost:3000/api/ingest/cron?limit=3"
```
