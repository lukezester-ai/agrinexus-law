"use client";

import { SitePageShell } from "@/components/site-page-shell";

export default function TermsPage() {
	return (
		<SitePageShell maxWidth="3xl">
			<header className="mb-8 text-center sm:text-left">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Правна информация</p>
				<h1 className="font-display mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
					Условия за ползване
				</h1>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Последна актуализация: 1 май 2026</p>
			</header>

			<article className="surface-card space-y-8 p-6 sm:p-8">
				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Какво е AgriNexus.Law</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						AgriNexus.Law е платформа с AI асистенти, специализирани в българското земеделие. Чрез тримата ни персонажи
						(Юрисконсулт Елена, полевият специалист Борис, финансовият анализатор Виктория) предоставяме обща информация по
						правни, агрономически и икономически въпроси, свързани с фермерството в България.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">ВАЖНО: Какво AgriNexus.Law НЕ е</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						<strong className="text-slate-900 dark:text-white">AgriNexus.Law НЕ замества професионална консултация.</strong> Нашите
						AI асистенти:
					</p>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>Не са лицензирани адвокати, агрономи или счетоводители</li>
						<li>Не предоставят индивидуални правни, финансови или медицински (за животни) съвети</li>
						<li>Не носят отговорност за загуби, произтичащи от ваши решения</li>
						<li>Може да правят грешки или да не разполагат с актуална информация</li>
					</ul>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						За важни решения винаги се консултирайте с квалифициран професионалист.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Допустимо ползване</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">Можете да използвате AgriNexus.Law за:</p>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>Получаване на обща информация за ДФЗ субсидии и наредби</li>
						<li>Помощ с разбиране на процедури и документи</li>
						<li>Обучение за изискванията на ОСП 2023-2027</li>
					</ul>
					<p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">НЕ може да използвате AgriNexus.Law за:</p>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>Опити за заобикаляне на закона</li>
						<li>Спам или автоматизирани атаки върху системата</li>
						<li>Препродажба или препредаване на отговорите без позволение</li>
						<li>Подвеждаща употреба на отговорите</li>
					</ul>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Ограничения на отговорност</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						AgriNexus.Law се предоставя &ldquo;както е&rdquo;. Не гарантираме, че информацията е винаги актуална, точна или приложима за
						вашата конкретна ситуация. Не носим отговорност за: загубени субсидии, наложени глоби, пропуснати срокове или други щети,
						произтичащи от използването на платформата. Преди важни решения, винаги проверявайте актуалните регулации на dfz.bg и/или се
						консултирайте с професионалист.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Цени и плащане</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						В момента сме във фаза на ранен достъп. Първите 100 фермери получават безплатен достъп за първата година. След този период ще
						въведем ясни и достъпни абонаментни планове, за които ще ви информираме предварително.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Прекратяване</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Можем да прекратим достъпа ви при нарушение на тези условия. Можете по всяко време да прекратите използването на услугата и
						да поискате изтриване на данните си.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Приложимо право</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Тези условия се регулират от законодателството на Република България. При спорове, компетентен е съдът по адреса на
						регистрация на AgriNexus.Law.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Контакт</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Въпроси за условията? Пишете на <strong className="text-slate-900 dark:text-white">hello@agrinexus.bg</strong>
					</p>
				</section>
			</article>
		</SitePageShell>
	);
}
