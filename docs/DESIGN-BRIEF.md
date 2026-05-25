# Графичен дизайн · AgriNexus.Law MVP

Кратък бриф за визуалния език на публичния UI (**Next.js 15 + Tailwind CSS 4 + ShadCN UI**).

## Типография

| Роля        | Шрифт   | Забележка                                      |
|------------|---------|------------------------------------------------|
| Тяло, UI   | **Inter** | `latin` + `cyrillic` в `app/layout.tsx`     |
| Заглавия | **Outfit** + **Inter** (fallback) | Outfit в `next/font` е само латиница; кирилицата в заглавията идва от Inter чрез `font-family` в `globals.css`. |

Класове: `font-sans` (Inter), `font-display` (Outfit) — виж `globals.css`.

## Цветова система (CSS променливи)

Дефинирани в `app/globals.css` под `:root` / `.dark`:

- **Teal** — основен акцент (доверие, „държавна“ линия без мудност).
- **Indigo / blue** — вторичен акцент в градиенти (`text-gradient`).
- **Slate** — неутрали за текст и граници (по-студен тон от `stone` за по-добра двойка с teal).

## Повърхности

- **`glass-panel`** — frosted hero / търсачка.
- **`surface-card`** — по-плътни карти (чат панел, модулни блокове): лек inset highlight + мека сянка.
- **`agri-page-bg`** — фон на страницата с радиални „петна“ + лек горен ореол за дълбочина.

## Интеракция и достъпност

- **`:focus-visible`** — 2px outline в brand teal (клавиатурна навигация).
- **`::selection`** — подчертан избор с полупрозрачен teal.

## Чат / Markdown

Съобщенията минават през `components/chat-markdown.tsx`. Бubbles: закръглени `rounded-xl`, разделение user (бяло / slate) vs assistant (emerald tint).

## Обвивка на страници

- **`SiteHeader`** (`components/site-header.tsx`) — единна горна лента с лого, навигация и бутон към `/search`.
- **`SitePageShell`** (`components/site-page-shell.tsx`) — `agri-page-bg` + header + опционален `subheader` + `<main>` с избор на `maxWidth` (`xl` … `7xl`).

Новите публични страници да ползват `SitePageShell`, освен ако не е умишлено standalone.

## Иконки

**lucide-react** — монолинейни, 1.5px stroke; акцентни цветове `text-emerald-700` / `dark:text-emerald-300`.

## Тъмен режим

Клас `dark` на `<html>`; същите токени с по-висок контраст за teal и по-меки сиви за фон.

---

При нови екрани: приоритет **съгласуван slate + emerald/teal**, избягвай произволни hex извън `app/globals.css` (токени в `:root` / `.dark` и блока `@theme inline`), освен ако не се регистрират като цветови токени.

## ShadCN UI и дизайн токени

- Конфигурация: `components.json` (стил **new-york**, RSC, Lucide).
- Глобални променливи и мапване към Tailwind: `app/globals.css` (`@import "tailwindcss"`, `@theme inline`, `@custom-variant dark`).
- Примитиви: `components/ui/*` (напр. `Button`, `Card`). Нови блокове: `npx shadcn@latest add <component>`.
- Утилита `cn()`: `lib/utils.ts` (`clsx` + `tailwind-merge`).

Подробности: `docs/DESIGN-SYSTEM.md`.
