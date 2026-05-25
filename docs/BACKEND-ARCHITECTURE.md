# Backend архитектура · AgriNexus MVP

**„Мозъкът“** на продукта = дълги процеси, AI оркестрация, тежък ingest, фонови задачи и интеграции. **Препоръчан избор за този слой: FastAPI (Python).**

## Какво имаме днес

| Слой | Технология | Роля |
|------|------------|------|
| UI + BFF | **Next.js 15** (App Router) | Страници, SSR, `app/api/*` — тънък HTTP слой до Supabase, rate limits, чат стрийм към OpenAI. |
| Данни | **Supabase** (Postgres + pgvector) | Персистентност, RAG chunks, `chat_logs`. |
| Обектно хранилище | **Cloudflare R2** (опционално) | Оригинални PDF/DOCX/изображения/сертификати — виж `docs/FILE-STORAGE.md`. |
| Edge / serverless | **Vercel** (ако deploy-вате там) | Подходящ за API routes с кратък живот на заявката. |

Това е валиден **MVP и production** модел: малко движещи се части, един език (TypeScript) в репото.

## Защо FastAPI за „мозъка“

| Причина | Обяснение |
|---------|-----------|
| **AI / ML екосистема** | Python е де-факто стандарт за RAG tooling — **LlamaIndex** (структуриран retrieval, query engines), LangChain, eval, batch jobs. |
| **Async + тежки задачи** | FastAPI + Uvicorn/Hyper — ясни `async` endpoints; лесно връзване към **Celery / RQ / Dramatiq** за ingest, reindex, crawl. |
| **OpenAPI по подразбиране** | Автоматична схема за клиенти и QA; удобно при растеж на екипа. |
| **Отделяне от UI deploy** | Мозъкът се пакетира като контейнер (Fly.io, Railway, GCP Cloud Run, k8s) с различни лимити на CPU/RAM от Next. |
| **Типизация** | Pydantic v2 — строги модели на заявки/отговори, близко до „контракт“ с фронта. |

Next.js API routes остават отлични за **BFF**: сесии, cookie, проксиране към FastAPI със service token, кеширане на публични отговори.

## Целева картина (хибрид)

```
Браузър → Next.js (UI + BFF /api/*)
              ↳ вътрешно HTTP → FastAPI „brain“ (дълги задачи, batch RAG, workers)
              ↳ директно → Supabase (където още е по-просто)
```

- **Публичен чат** може да остане в Next (вече работи) или постепенно да се пренасочи към FastAPI ако искате единен Python pipeline за retrieval + LLM.
- **Reindex / ingest / web crawl** са първи кандидати за пренос в FastAPI + опашка.

## Стартер в репото

Папка **`services/agrinexus-brain/`** — минимално FastAPI приложение (`GET /health`) и инструкции за локален старт. Разширявайте с роутове, dependency injection, отделни модули (`routers/`, `services/`).

## Променливи (бъдещо)

- `AGRI_BRAIN_URL` — базов URL на FastAPI (само сървър-страна в Next `.env`).
- Споделен секрет за **mTLS** или `Authorization: Bearer <internal>` между Next и FastAPI.

## Свързани документи

- `docs/AI-SYSTEM.md`, `docs/AI-DOCUMENTATION.md` — LLM и RAG логика днес в TypeScript.
- `docs/FILE-STORAGE.md` — Cloudflare R2 за оригинални файлове; Python услугите могат да ползват същите S3-съвместими ключове (`boto3`).
- `DEPLOYMENT-GUIDE.md` — deploy на Next; FastAPI ще иска отделна секция при първи production deploy на „мозъка“.
