"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
            <ArrowLeft size={16} />
            <span className="text-sm">Към началото</span>
          </Link>
          <div className="font-medium text-base dark:text-stone-100">Поверителност</div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-medium mb-2 dark:text-stone-50">Политика за поверителност</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">Последна актуализация: 1 май 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Общи положения</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            AgriNexus.Law уважава вашата лична информация и поверителност. Тази политика обяснява как събираме, 
            използваме и защитаваме вашите данни, когато използвате нашата платформа.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Какви данни събираме</h2>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li><strong>Имейл адрес</strong> - когато се регистрирате в waitlist</li>
            <li><strong>Информация за стопанството</strong> - тип, размер, регион (само ако вие я въведете)</li>
            <li><strong>Чат история</strong> - запазваме разговорите за подобрение на услугата (анонимизирано)</li>
            <li><strong>Технически данни</strong> - IP адрес, браузър, време на посещение (за сигурност)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Как използваме данните</h2>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li>За да предоставим услугата (отговорим на въпроси)</li>
            <li>За да изпратим welcome имейл и обновления (можете да се отпишете)</li>
            <li>За подобряване на отговорите на AI асистентите</li>
            <li>За защита от злоупотреби и spam</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Какво НЕ правим</h2>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li>Не продаваме вашите данни на трети страни</li>
            <li>Не споделяме чат разговори с други потребители</li>
            <li>Не използваме вашата информация за реклами от трети страни</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Вашите права (GDPR)</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300 mb-3">
            Имате право да:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li>Поискате достъп до данните, които пазим за вас</li>
            <li>Поискате корекция или изтриване на данните</li>
            <li>Се отпишете от имейл известия по всяко време</li>
            <li>Подадете жалба до КЗЛД</li>
          </ul>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300 mt-3">
            Свържете се с нас на: <strong>privacy@agrinexus.bg</strong>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Бисквитки (Cookies)</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            Използваме минимум технически бисквитки за работата на сайта и анонимна аналитика чрез Vercel Analytics. 
            Не използваме рекламни или проследяващи бисквитки на трети страни.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Промени в политиката</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            Можем да актуализираме тази политика периодично. Ще ви известим за съществени промени по имейл 
            или чрез известие на сайта.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Контакт</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            Въпроси за поверителността? Пишете ни на <strong>privacy@agrinexus.bg</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
