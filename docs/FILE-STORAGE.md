# File storage · Cloudflare R2

**Препоръка:** **Cloudflare R2** (S3-съвместим API) за **оригинални файлове** — PDF, DOCX, **изображения**, **сертификати** и други бинарни обекти, с евтино съхранение и без egress такси към Cloudflare.

## Защо R2

| Нужда | Как помага |
|-------|------------|
| **PDF / DOCX / images** | Един bucket + префикси по тип (`public-documents/`, `farmer-uploads/`, `certificates/`). |
| **Сертификати / сканове** | Версиониране по ключ (`{userId}/{year}/{id}.pdf`); опционално публичен custom domain или signed URLs от сървъра. |
| **Интеграция** | S3 API → официален клиент `@aws-sdk/client-s3` в Node; същият модел може да се ползва и от **FastAPI** (`boto3` / `aioboto3`). |
| **Съвместимост с проекта** | Текущо: **Supabase Storage** за farmer docs и ingest pipeline; R2 е **допълнение** за оригинали и мащаб — виж миграция по-долу. |

## Променливи на средата

| Променлива | Задължителност | Описание |
|------------|----------------|----------|
| `R2_ACCOUNT_ID` | За R2 upload | Cloudflare account id (R2 overview). |
| `R2_ACCESS_KEY_ID` | За R2 upload | API token access key (R2 → Manage R2 API Tokens). |
| `R2_SECRET_ACCESS_KEY` | За R2 upload | Secret към ключа. |
| `R2_BUCKET_NAME` | За R2 upload | Име на bucket. |
| `R2_PUBLIC_URL` | Опционално | Публичен URL (custom domain или r2.dev) за директни линкове; без него файловете са само през signed URL логика (бъдещо). |

Копирайте шаблона от `.env.example`.

## Имплементация в това repo

- **`lib/storage/r2.ts`** — `isR2Configured()`, `putPublicDocumentObject()` — качва байтовете под ключ `public-documents/{docId}/{filename}`.
- **`/api/ingest/upload`** — след успешен ingest на PDF: ако R2 е конфигуриран, записва **оригинала** в bucket и обновява `public_documents.storage_path` (иначе остава `pending` — виж отговора на API за `r2Stored`).

`public_documents.content_hash` и `storage_path` се попълват при insert (hash на файла; уникален `source_url` = `uploaded:{hash}`).

## Миграция от Supabase Storage (по избор)

Днес **`lib/farmer-docs-supabase.ts`** и **`lib/ingest/download-and-persist-public-doc.ts`** ползват Supabase buckets. Възможни стъпки:

1. Създайте R2 bucket и API токен с права Object Read & Write.  
2. Пренесете обектите (rclone `s3` profile към R2 endpoint).  
3. Обновете `storage_path` в таблиците да сочат R2 ключ или пълен URL.  
4. Сменете upload/delete логиката да извиква R2 вместо `supabase.storage`.

До тогава **двата** варианта могат да съществуват: R2 за нови публични PDF от админ панела (ако env е зададен), Supabase за съществуващи потоци.

## Свързано

- `docs/RAG-SYSTEM.md` — текстът за RAG идва от парсване; R2 пази **оригинала** за повторно изтегляне и compliance.  
- `docs/BACKEND-ARCHITECTURE.md` — Python услуги могат да пишат директно в R2 със същите ключове (чрез env в контейнера).
