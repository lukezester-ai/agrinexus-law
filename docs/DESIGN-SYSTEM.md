# UI дизайн система · AgriNexus MVP

Стек: **Tailwind CSS 4** + **ShadCN UI** (new-york) + **Framer Motion**, върху Next.js App Router.

## Tailwind 4

- Вход: `app/globals.css` с `@import "tailwindcss"`.
- Сканиране на класове: `@source` за `./app/**` и `../components/**` (пътищата са спрямо `app/globals.css`).
- PostCSS: `postcss.config.mjs` използва само `@tailwindcss/postcss` (без отделен `tailwind.config.ts` — темата е в CSS).

## ShadCN UI

- `components.json` — алиаси `@/components`, `@/lib/utils`, `@/components/ui`.
- Тема: ShadCN променливи (`--background`, `--primary`, …) в `:root` / `.dark` + мапване в `@theme inline` за utilities като `bg-background`, `text-muted-foreground`, `border-border`.
- **Glass / AI** слой: запазени са агро-специфичните класове (`.glass-card`, `.glass-panel`, `.text-gradient-ai`, …) до/доедно с ShadCN токените.

### Добавяне на компоненти

```bash
cd agrinexus-mvp
npx shadcn@latest add dialog dropdown-menu sheet
```

След `add` провери импортите и при нужда коригирай `className` с `cn()`.

## Framer Motion (анимации)

- Зависимост: `framer-motion`.
- Споделени easing / variants: `lib/motion-variants.ts` (кинематографски easing, hero stagger, чат балони, навигационна лента).
- **`useReducedMotion()`** — при системна настройка за намален фон анимациите се „изключват“ (празни variants / без keyframe mesh).

## AI University палитра (2025)

Светъл, „premium SaaS“, без тъмно зелено и тежки рамки:

| Роля | Стойност | Бележка |
|------|----------|---------|
| Основен фон | `#F4F7FB` / `#F7FAFC` | `--agri-bg-ultra`, `--agri-bg-soft`, body |
| Neon Agri Green | `#4ADE80` (alt `#6EE7B7`) | CTA градиент, AI акценти, `--brand-ai-green` |
| Aqua / Cyan | `#22D3EE` (alt `#67E8F9`) | втори край на CTA, мрежови „orbs“, `--brand-ai-cyan` |
| Emerald accent | `#10B981` | текстови градиенти, `--brand-emerald` |
| Glass | `rgba(255,255,255,0.22–0.3)` + `blur(18–20px)` | `.glass-panel`, `.glass-card` |
| Hero | `linear-gradient(135deg, #F4F7FB → #DFF7EA → #D9F4FF → #fff)` | `.ai-hero-section` + `.ai-hero-orbs` |
| Primary CTA | `linear-gradient(135deg, #4ADE80, #22D3EE)` | `.brand-cta-bg`, `Button variant="brand"` |
| Заглавия | **Space Grotesk** (`--font-space-grotesk`) | кирилица → Inter fallback |
| Текст | **Inter** | `--font-inter` |

Персонажи (accent): Елена — cyan; Борис — emerald green; Виктория — amber/gold (`lib/characters.ts`).


- Публични страници: `SitePageShell` + ShadCN `Button` / `Card` за повторяеми CTA и карти.
- Не смесвай произволни Tailwind цветове извън токените — за нови нюанси добави `--color-*` в `@theme inline` и източник в `:root`.
