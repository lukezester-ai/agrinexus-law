"use client";

import { SitePageShell } from "@/components/site-page-shell";
import { Scale, Shield, Users, FileText, Brain, HeartHandshake, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

const values = [
	{ icon: Scale, title: "Точност", desc: "Всеки отговор съдържа линк към официален източник — наредба, закон, писмо на ДФЗ." },
	{ icon: Shield, title: "Сигурност", desc: "GDPR compliant. Данните ви се ползват само за подобряване на асистента." },
	{ icon: HeartHandshake, title: "Достъпност", desc: "Безплатен план за всеки фермер. Премиум само за допълнителни модули." },
	{ icon: Brain, title: "AI с контекст", desc: "Обучен върху български наредби, ОСП, ДФЗ и еврорегламенти." },
];

const team = [
	{
		initials: "ЕП",
		name: "Елена Петрова",
		role: "Юрисконсулт",
		bio: "С опит в агроправото и ОСП. Следи всяка промяна в ДФЗ наредбите и помага на фермерите с документация.",
	},
	{
		initials: "БД",
		name: "Борис Димитров",
		role: "Агроном",
		bio: "Бивш полеви инспектор в МЗХ. Познава терените, културите и биологичното производство отвътре.",
	},
	{
		initials: "ВС",
		name: "Виктория Стоянова",
		role: "Финансов анализатор",
		bio: "Специалист по агрофинанси, субсидии и данъци. Помага за оптимизиране на стопанския отчет.",
	},
];

const milestones = [
	{ year: "2023", event: "Идеята — AI асистент за български фермери" },
	{ year: "2024", event: "MVP с три AI персонажа (Елена, Борис, Виктория)" },
	{ year: "2025", event: "Добавени 12+ модула: парцели, склад, счетоводство, химизация" },
	{ year: "2026", event: "Интеграция с ДФЗ срокове, Stripe абонаменти, PWA" },
];

export default function AboutPage() {
	return (
		<SitePageShell maxWidth="4xl">
			{/* Hero */}
			<section className="text-center sm:text-left">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
					За нас
				</p>
				<h1 className="font-display mt-2 text-3xl font-medium tracking-tight text-slate-950 dark:text-white sm:text-4xl">
					AgriNexus.Law — AI за българското земеделие
				</h1>
				<p className="mt-4 max-w-2xl leading-relaxed text-slate-500 dark:text-slate-400">
					Помагаме на фермерите да се ориентират в наредби, срокове и документи — чрез трима AI асистенти,
					които говорят на разговорен български и цитират официални източници.
				</p>
			</section>

			{/* Мисия */}
			<section className="surface-card mt-8 p-6 sm:p-8">
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Нашата мисия</h2>
				<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
					Българският фермер работи в сложна регулаторна среда — десетки наредби, кратки срокове,
					хиляди страници документация. Ние вярваме, че технологията може да опрости това.
				</p>
				<p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
					Затова създадохме AgriNexus.Law — AI асистент, който разбира контекста на българското
					земеделие, отговаря с линкове към реални източници и помага за управлението на стопанството
					от един dashboard.
				</p>
			</section>

			{/* Ценности */}
			<section className="mt-10">
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Какво ни отличава</h2>
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					{values.map((v) => (
						<div key={v.title} className="surface-card flex gap-4 p-5">
							<div className="mt-0.5 shrink-0 rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">
								<v.icon size={20} className="text-emerald-700 dark:text-emerald-300" />
							</div>
							<div>
								<h3 className="font-semibold text-slate-900 dark:text-white">{v.title}</h3>
								<p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{v.desc}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Екип */}
			<section className="mt-10">
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Нашият екип</h2>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					Трима AI асистенти, създадени от екип от агрономи, юристи и инженери.
				</p>
				<div className="mt-5 grid gap-5 sm:grid-cols-3">
					{team.map((m) => (
						<div key={m.name} className="surface-card p-5 text-center">
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
								{m.initials}
							</div>
							<h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{m.name}</h3>
							<p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{m.role}</p>
							<p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{m.bio}</p>
						</div>
					))}
				</div>
			</section>

			{/* История */}
			<section className="mt-10">
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">История</h2>
				<div className="surface-card mt-5 divide-y divide-slate-100 dark:divide-slate-800">
					{milestones.map((m) => (
						<div key={m.year} className="flex items-center gap-4 p-4">
							<span className="shrink-0 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
								{m.year}
							</span>
							<p className="text-sm text-slate-600 dark:text-slate-300">{m.event}</p>
						</div>
					))}
				</div>
			</section>

			{/* Доверие + CTA */}
			<section className="surface-card mt-10 border-t-2 border-emerald-500 p-6 text-center sm:p-8">
				<CheckCircle size={32} className="mx-auto text-emerald-600 dark:text-emerald-400" />
				<h2 className="font-display mt-3 text-xl font-bold text-slate-900 dark:text-white">
					Готови ли сте да улесните стопанството си?
				</h2>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					Започнете безплатно — без кредитна карта, без ангажимент.
				</p>
				<div className="mt-5 flex flex-wrap justify-center gap-3">
					<Link
						href="/vhod"
						className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
					>
						Създайте акаунт
						<ArrowRight size={16} />
					</Link>
					<Link
						href="/ceni"
						className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
					>
						Вижте цените
					</Link>
				</div>
			</section>

			{/* Footer disclaimer */}
			<p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
				AgriNexus.Law е платформа с AI асистенти. Информацията не замества професионална консултация.
			</p>
		</SitePageShell>
	);
}
