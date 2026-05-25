# Search system · Typesense (видеа, PDF, уроци)

**Цел:** единно **AI-подкрепено търсене** върху смесено съдържание — **видеа**, **PDF**, **структурирани уроци** — заедно с вече съществуващата ДФЗ база и ingest документи в `/api/search`.

**Препоръчан двигател за този слой:** [Typesense](https://typesense.org/) — typo-tolerant full-text, филтри, facet-и, бърз self-hosted или Typesense Cloud.

## Как е вградено в MVP

| Компонент | Роля |
|-----------|------|
| `lib/typesense.ts` | Клиент към Typesense; `searchWithTypesense()` мапва документи към `KnowledgeDoc` (`type`: `video` \| `pdf` \| `lesson`). |
| `app/api/search/route.ts` | Ако са зададени `TYPESENSE_*`, първо се пита Typesense; при липса на хитове или конфиг — **fallback към Meilisearch** (`MEILI_*`), после merge с вътрешната ДФЗ база (`mergeKnowledgeSearchResults`). |
| `docs/SEARCH-SYSTEM.md` | Този файл — схема на колекция, env, индексиране. |

**Meilisearch** остава опционален втори лексикален източник (напр. само за статичната `KNOWLEDGE_BASE` индексация). **Typesense** е препоръчаният път за **мултимедия и обучение**.

## Променливи (`.env` / `.env.local`)

| Променлива | Задължителност | Описание |
|------------|----------------|----------|
| `TYPESENSE_HOST` | Да | Хост без протокол (напр. `localhost` или `xxx.typesense.net`). |
| `TYPESENSE_API_KEY` | Да | Search-only или admin ключ според средата. |
| `TYPESENSE_PORT` | Не | По подразбиране `443`. |
| `TYPESENSE_PROTOCOL` | Не | `https` (по подразбиране) или `http` локално. |
| `TYPESENSE_COLLECTION` | Не | Име на колекция; по подразбиране `agrinexus_learning_content`. |
| `TYPESENSE_QUERY_BY` | Не | Полета за търсене, разделени със запетая; по подразбиране `title,description,transcript,tags`. |

## Схема на колекцията (пример)

Документите трябва да включват поне:

- `id` (string) — стабилен идентификатор в Typesense.
- `kind` — едно от: `video`, `pdf`, `lesson` (ползва се за `KnowledgeDoc.type`).
- `title`, `description` (опционално), `transcript` (опционално — текст/субтитри за видеа).
- `tags` (string[]) — ключови думи.
- `category` (string) — за UI; филтърът по категория в сайта се прилага **след** merge върху `KnowledgeDoc` (`categoryMatchesFilter`).
- `published_at` (string, ISO) — мапва се към `effectiveDate`.
- `url` (опционално) — публичен линк към видео/PDF/урок → `sourceUrl`.
- `source_label` (опционално) — показвано като `source`.
- `instructor` (опционално) — добавя се към `keywords`.

Пример за създаване през API (насочващ — адаптирайте към вашия Typesense):

```json
{
  "name": "agrinexus_learning_content",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "kind", "type": "string", "facet": true },
    { "name": "title", "type": "string" },
    { "name": "description", "type": "string", "optional": true },
    { "name": "transcript", "type": "string", "optional": true },
    { "name": "tags", "type": "string[]", "facet": true, "optional": true },
    { "name": "category", "type": "string", "facet": true, "optional": true },
    { "name": "published_at", "type": "string", "optional": true },
    { "name": "url", "type": "string", "optional": true },
    { "name": "source_label", "type": "string", "optional": true },
    { "name": "instructor", "type": "string", "optional": true }
  ]
}
```

**Забележка:** За сортиране по дата в Typesense ползвайте `int64` epoch в отделно поле или конфигурирайте `default_sorting_field` според [документацията](https://typesense.org/docs/).

## Индексиране

- **Видеа:** при ingest записвайте заглавие, описание, **транскрипт/субтитри** в `transcript` за пълно текстово търсене.
- **PDF:** текст от OCR/парсер в `description` или отделно поле, включено в `TYPESENSE_QUERY_BY`.
- **Уроци:** структурирани секции, обединени в `description` + `tags`.

Импорт: Typesense API `import` / клиентски `documents().import()` от worker или админ скрипт (не е задължително в Next bundle).

## Свързано

- `docs/AI-DOCUMENTATION.md` — `/api/search`, rate limits.
- `docs/RAG-SYSTEM.md` — векторно търсене в чата; Typesense е **лексикален** слой за публичното търсене и може да се комбинира с RAG при бъдещ sync на същите документи.
