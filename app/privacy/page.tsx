"use client";

import { SitePageShell } from "@/components/site-page-shell";
import { CookiePreferencesButton } from "@/components/cookie-preferences-button";

export default function PrivacyPage() {
	return (
		<SitePageShell maxWidth="3xl">
			<header className="mb-10 text-center sm:text-left">
				<div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
					<span>Правна и GDPR Информация</span>
				</div>
				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
					Политика за поверителност
				</h1>
				<p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Последна актуализация: 1 май 2026 · В съответствие с Регламент (ЕС) 2016/679 (GDPR)</p>
			</header>

			<article className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] space-y-8 p-6 sm:p-10 backdrop-blur-2xl">
				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Общи положения</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						AgriNexus.Law уважава вашата лична информация и поверителност. Тази политика обяснява как събираме, използваме и защитаваме
						вашите данни, когато използвате нашата платформа.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Какви данни събираме</h2>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>
							<strong className="text-slate-900 dark:text-white">Информация за стопанството</strong> — тип, размер, регион (само ако я
							въведете в профила; пази се локално в браузъра)
						</li>
						<li>
							<strong className="text-slate-900 dark:text-white">Чат история</strong> — запазваме разговорите за подобрение на услугата
							(анонимизирано)
						</li>
						<li>
							<strong className="text-slate-900 dark:text-white">Технически данни</strong> — IP адрес, браузър, време на посещение (за
							сигурност)
						</li>
					</ul>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Как използваме данните</h2>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>За да предоставим услугата (отговорим на въпроси)</li>
						<li>За подобряване на отговорите на AI асистентите</li>
						<li>За защита от злоупотреби и spam</li>
					</ul>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Какво НЕ правим</h2>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>Не продаваме вашите данни на трети страни</li>
						<li>Не споделяме чат разговори с други потребители</li>
						<li>Не използваме вашата информация за реклами от трети страни</li>
					</ul>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Вашите права (GDPR)</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">Имате право да:</p>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
						<li>Поискате достъп до данните, които пазим за вас</li>
						<li>Поискате корекция или изтриване на данните</li>
						<li>Подадете жалба до КЗЛД</li>
					</ul>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Свържете се с нас на: <strong className="text-slate-900 dark:text-white">privacy@agrinexus.bg</strong>
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Бисквитки (Cookies)</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Използваме минимум технически бисквитки за работата на сайта и анонимна аналитика чрез Vercel Analytics. Не използваме
						рекламни или проследяващи бисквитки на трети страни.
					</p>
					<div className="mt-4">
						<CookiePreferencesButton />
					</div>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Промени в политиката</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Можем да актуализираме тази политика периодично. Ще ви известим за съществени промени по имейл или чрез известие на сайта.
					</p>
				</section>

				<section>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Контакт</h2>
					<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
						Въпроси за поверителността? Пишете ни на <strong className="text-slate-900 dark:text-white">privacy@agrinexus.bg</strong>
					</p>
				</section>
			</article>
		</SitePageShell>
	);
}
