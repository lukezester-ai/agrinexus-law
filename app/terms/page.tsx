"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
            <ArrowLeft size={16} />
            <span className="text-sm">Към началото</span>
          </Link>
          <div className="font-medium text-base dark:text-stone-100">Условия за ползване</div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-medium mb-2 dark:text-stone-50">Условия за ползване</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">Последна актуализация: 1 май 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Какво е AgriNexus.Law</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            AgriNexus.Law е платформа с AI асистенти, специализирани в българското земеделие. 
            Чрез тримата ни персонажи (Юрисконсулт Елена, полевият специалист Борис, финансовият анализатор Виктория) предоставяме 
            обща информация по правни, агрономически и икономически въпроси, свързани с фермерството в България.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">ВАЖНО: Какво AgriNexus.Law НЕ е</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300 mb-3">
            <strong>AgriNexus.Law НЕ замества професионална консултация.</strong> Нашите AI асистенти:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li>Не са лицензирани адвокати, агрономи или счетоводители</li>
            <li>Не предоставят индивидуални правни, финансови или медицински (за животни) съвети</li>
            <li>Не носят отговорност за загуби, произтичащи от ваши решения</li>
            <li>Може да правят грешки или да не разполагат с актуална информация</li>
          </ul>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300 mt-3">
            За важни решения винаги се консултирайте с квалифициран професионалист.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Допустимо ползване</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300 mb-3">
            Можете да използвате AgriNexus.Law за:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li>Получаване на обща информация за ДФЗ субсидии и наредби</li>
            <li>Помощ с разбиране на процедури и документи</li>
            <li>Обучение за изискванията на ОСП 2023-2027</li>
          </ul>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300 mt-3 mb-3">
            НЕ може да използвате AgriNexus.Law за:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 dark:text-stone-300">
            <li>Опити за заобикаляне на закона</li>
            <li>Спам или автоматизирани атаки върху системата</li>
            <li>Препродажба или препредаване на отговорите без позволение</li>
            <li>Подвеждаща употреба на отговорите</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Ограничения на отговорност</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            AgriNexus.Law се предоставя &ldquo;както е&rdquo;. Не гарантираме, че информацията е винаги актуална, 
            точна или приложима за вашата конкретна ситуация. Не носим отговорност за: 
            загубени субсидии, наложени глоби, пропуснати срокове или други щети, произтичащи от 
            използването на платформата. Преди важни решения, винаги проверявайте актуалните регулации 
            на dfz.bg и/или се консултирайте с професионалист.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Цени и плащане</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            В момента сме във фаза на ранен достъп. Първите 100 фермери получават безплатен достъп 
            за първата година. След този период ще въведем ясни и достъпни абонаментни планове, 
            за които ще ви информираме предварително.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Прекратяване</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            Можем да прекратим достъпа ви при нарушение на тези условия. Можете по всяко време да 
            прекратите използването на услугата и да поискате изтриване на данните си.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Приложимо право</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            Тези условия се регулират от законодателството на Република България. 
            При спорове, компетентен е съдът по адреса на регистрация на AgriNexus.Law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-medium mb-3 dark:text-stone-100">Контакт</h2>
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">
            Въпроси за условията? Пишете на <strong>hello@agrinexus.bg</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
