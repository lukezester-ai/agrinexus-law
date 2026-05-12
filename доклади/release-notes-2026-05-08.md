# Release Notes - 2026-05-08

## Основни промени

- Подобрена сигурност на onboarding-а: входът с имейл вече минава през сървърен `magic-link` endpoint с rate limit и по-строга валидация.
- Добавен GDPR cookie consent банер с `Приеми/Откажи`, consent-gated analytics и бутон за промяна на cookie предпочитания в страницата за поверителност.
- Чатът е ограничен за влезли потребители (UI и API защита), с ясен CTA към вход.
- `Статистика` е свързана с RAG: нов insights endpoint, RAG/BM25 контекст и бърз преход към чат с prefilled prompt.

## Deployment checklist

- Потвърди, че Supabase Auth redirect URL включва `/auth/callback`.
- Провери `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Тествай след deploy:
  - вход с имейл + magic link,
  - waitlist submit,
  - cookie consent flow (accept/reject/change preferences),
  - flow `Статистика -> Попитай AI -> Чат` за влязъл потребител.
