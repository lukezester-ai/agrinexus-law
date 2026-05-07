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
- **RAG-light система** - всеки въпрос намира релевантни документи и ги дава като контекст
- **Профил на стопанството** - персонализирани отговори
- **Базова търсачка** с филтри по категории
- **Supabase интеграция** за waitlist и chat logs
- **Resend имейли** с професионални welcome съобщения
- **Rate limiting** срещу abuse
- **Mobile responsive** дизайн
- **GDPR compliance** - Privacy Policy на български

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
