# AgriNexus.Law MVP 1.0 - Пълно ръководство за стартиране

Това е production-ready MVP, който може да се пусне на пазара. Включва тримата персонажа, Supabase база данни, Resend за имейли, rate limiting, аналитика и базова търсачка.

## Какво е включено

### Функционалности
- ✅ Landing page с тримата персонажа (Елена, Борис, Виктория)
- ✅ AI чат бот с OpenAI (по подразбиране gpt-4o-mini)
- ✅ ДФЗ knowledge база с 12+ структурирани документа
- ✅ RAG-light: всеки въпрос търси релевантни документи и ги дава като контекст
- ✅ Профил на стопанството с персонализирани отговори
- ✅ Базова търсачка с филтри по категории
- ✅ Waitlist форма със Supabase запис
- ✅ Welcome имейли чрез Resend
- ✅ Rate limiting срещу abuse
- ✅ Privacy Policy и Terms на български
- ✅ Vercel Analytics
- ✅ Mobile responsive
- ✅ SEO оптимизация на български

### Технологии
- Next.js 15 + TypeScript + Tailwind
- OpenAI API
- Supabase (PostgreSQL)
- Resend (имейли)
- Upstash Redis (rate limiting)
- Vercel hosting

---

## ЧАСТ 1: Регистрации в нужните услуги (30 минути)

Трябват ви акаунти в следните услуги. Всички имат безплатни планове за стартиране.

### 1. OpenAI - за AI chat API

1. Отворете https://platform.openai.com
2. Sign Up с имейл или Google акаунт
3. Потвърдете имейла
4. В лявото меню: API Keys → Create Key
5. Дайте име "AgriNexus.Law" и натиснете Create
6. **ВАЖНО:** копирайте ключа (sk-...) НЕЗАБАВНО - после няма да можете да го видите!
7. Получавате стартов кредит/лимит за тестване според вашия акаунт

### 2. Supabase - за базата данни

1. Отворете https://supabase.com и Sign Up (с GitHub е най-лесно)
2. Натиснете "New Project"
3. Име: "agrinexus", Region: "Frankfurt" (за БГ е най-близо), парола: измислете силна
4. Изчакайте 2 минути да се създаде
5. В Settings → API намерете и копирайте:
   - `Project URL` → това е вашия NEXT_PUBLIC_SUPABASE_URL
   - `anon public` ключа → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` ключа (Reveal) → SUPABASE_SERVICE_ROLE_KEY

6. Отворете SQL Editor и изпълнете съдържанието на `supabase-setup.sql`

### 3. Resend - за имейли (опционално, но препоръчително)

1. Отворете https://resend.com и Sign Up
2. API Keys → Create API Key
3. Копирайте ключа (re_...)
4. **За production:** добавете и верифицирайте домейна си (agrinexus.bg)
5. **За тестване:** можете да използвате тестовия домейн на Resend

### 4. Upstash - за rate limiting (опционално)

1. Отворете https://upstash.com и Sign Up с GitHub
2. Create Database → Redis
3. Име: "agrinexus", Region: "eu-west-1"
4. След създаването, копирайте:
   - REST URL → UPSTASH_REDIS_REST_URL
   - REST TOKEN → UPSTASH_REDIS_REST_TOKEN

### 5. GitHub и Vercel

1. https://github.com - Sign Up (ако нямате)
2. https://vercel.com - Sign Up С GITHUB АКАУНТА (важно!)

---

## ЧАСТ 2: Локално стартиране (15 минути)

### Изисквания
- Node.js 20+ (изтегляте от https://nodejs.org)
- Git (изтегляте от https://git-scm.com)
- Code editor (препоръчвам VS Code или Cursor)

### Стъпки

1. Разархивирайте проекта в папка по ваш избор

2. Отворете terminal/command prompt в папката:
```bash
cd path/to/agrinexus-mvp
```

3. Инсталирайте dependencies (отнема 2-3 минути):
```bash
npm install
```

4. Създайте `.env.local` файл (копирайте от `.env.example`):
```bash
# Windows:
copy .env.example .env.local

# Mac/Linux:
cp .env.example .env.local
```

5. Отворете `.env.local` и попълнете с реалните стойности от Част 1

6. Стартирайте dev сървъра:
```bash
npm run dev
```

7. Отворете http://localhost:3000

Ако всичко работи - ще видите AgriNexus.Law с тримата персонажа!

### Тестове за проверка

Тествайте следното:
- [ ] Главната страница се зарежда
- [ ] Можете да превключвате между Елена, Борис и Виктория
- [ ] Чат бот отговаря (с реален OpenAI API)
- [ ] Профил страницата записва данни
- [ ] Търсачка показва резултати
- [ ] Waitlist форма работи (проверете в Supabase)
- [ ] Получавате welcome имейл (ако сте настроили Resend)

---

## ЧАСТ 3: Качване в GitHub (10 минути)

1. Създайте нов repository в GitHub:
   - Отидете на https://github.com/new
   - Име: `agrinexus`
   - Private (за сега)
   - НЕ добавяйте README, .gitignore или license (ние ги имаме)
   - Create

2. В terminal-а, в папката на проекта:
```bash
git init
git add .
git commit -m "Initial commit: AgriNexus.Law MVP 1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agrinexus.git
git push -u origin main
```

Заместете YOUR_USERNAME с вашия GitHub username.

---

## ЧАСТ 4: Deployment на Vercel (10 минути)

1. Отворете https://vercel.com
2. "Add New" → "Project"
3. Изберете GitHub repo `agrinexus`
4. Framework Preset: Next.js (автоматично разпознато)
5. **ВАЖНО:** В Environment Variables секцията добавете ВСИЧКИ променливи от вашия `.env.local`:
   - OPENAI_API_KEY
   - OPENAI_MODEL (напр. gpt-4o-mini)
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - RESEND_API_KEY (ако имате)
   - UPSTASH_REDIS_REST_URL (ако имате)
   - UPSTASH_REDIS_REST_TOKEN (ако имате)
   - NEXT_PUBLIC_TURNSTILE_SITE_KEY (препоръчително за production)
   - TURNSTILE_SECRET_KEY (препоръчително за production)

6. Натиснете "Deploy"
7. Изчакайте 2-3 минути
8. Получавате URL: `agrinexus-xyz.vercel.app`

Готово - вашият сайт е live!

---

## ЧАСТ 5: Свързване на собствен домейн (15 минути)

### Купуване на домейн
- За .bg: https://register.bg или местен регистратор (около 50 лв/година)
- За .com: https://namecheap.com или https://cloudflare.com (около 25 лв/година)

### Свързване с Vercel

1. В Vercel Dashboard → вашия проект → Settings → Domains
2. Добавете домейна (напр. agrinexus.bg)
3. Vercel ще ви даде DNS записи
4. Отидете в панела на регистратора на домейна
5. Добавете DNS записите според инструкциите на Vercel
6. Изчакайте 10-60 минути за propagation
7. Vercel автоматично ще генерира SSL сертификат

---

## ЧАСТ 6: Първи стъпки след launch

### Тестване с реални хора (КРИТИЧНО)

Преди публичен launch:
1. Покажете на 5-10 фермери (приятели, познати, или от LinkedIn)
2. Гледайте как използват сайта (Hotjar дава session recordings)
3. Питайте: "Какво те обърка? Какво ти липсва?"
4. Попълнете една таблица с обратната връзка

### Моментален launch checklist
- [ ] Тествани са всичките функционалности
- [ ] Privacy Policy и Terms са актуални (с вашите имейли)
- [ ] Welcome имейлът е тестван
- [ ] Имате custom домейн (или временно с .vercel.app)
- [ ] Vercel Analytics работи (виждате визити в dashboard)

### Маркетинг след launch
- LinkedIn пост обявяващ AgriNexus.Law
- Facebook групи за фермери (има няколко големи в България)
- Контакт с аграрни блогове и медии (АгроПловдив, Агрозона)
- Партньорства с НССЗ (Национална служба за съвети в земеделието)

---

## Често срещани проблеми и решения

### "npm install" дава грешки
- Проверете че имате Node.js 20+: `node --version`
- Изчистете cache: `npm cache clean --force` и опитайте пак

### Чат ботът дава 500 грешка
- Проверете дали OPENAI_API_KEY е правилен
- Проверете дали имате активен OpenAI billing/credits
- Вижте Vercel logs за конкретна грешка

### Waitlist не записва
- Проверете дали SQL скриптът е изпълнен в Supabase
- Проверете правилността на Supabase ключовете
- Тествайте Supabase връзката от dashboard

### Имейли не се изпращат
- Resend изисква верификация на домейн за production
- За тестване използвайте onboarding@resend.dev като FROM
- Проверете спам папката

---

## Бюджет за първия месец

- Vercel Hobby: $0
- Supabase Free: $0
- OpenAI API: ~$30-100 (зависи от трафика и модела)
- Resend Free: $0 (до 3000 имейла/месец)
- Upstash Free: $0
- Домейн: ~$25 (еднократно за година)

**Общо: $50-150 за първия месец.**

При достигане на 1000+ потребители, очаквайте $200-500/месец общо.

---

## Какво следва след MVP 1.0

### V1.1 (следващи 2-4 седмици)
- Реални илюстрации на персонажите (от илюстратор)
- Подобрен системен prompt въз основа на реални въпроси
- A/B тест на различни copy варианти
- Първи 50 платени потребители

### V1.5 (следващи 2-3 месеца)
- Истинска RAG система с векторна база
- Автоматичен scraping от Държавен вестник
- Известия за крайни срокове по имейл
- Библиотека с шаблони на документи
- Чат история за регистрирани потребители

### V2.0 (6-12 месеца)
- Мобилно приложение
- Автоматично генериране на документи
- Multi-agent колаборация между персонажите
- Интеграции с ИСАК (ако ДФЗ позволи)
- Enterprise портал за големи стопанства

---

## Контакт и поддръжка

Когато сте готови за следваща стъпка - връщайте се за помощ. Успех с AgriNexus.Law! 🌾
