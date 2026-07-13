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
			<section className="text-center sm:text-left mb-12">
				<div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
					<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
					<span>За компанията и AI екипа</span>
				</div>
				<h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600 leading-tight">
					AgriNexus.Law — AI за българското земеделие
				</h1>
				<p className="mt-4 max-w-3xl text-base sm:text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-300">
					Помагаме на фермерите да се ориентират в наредби, срокове и документи — чрез трима специализирани AI асистенти,
					които говорят на разговорен български и винаги цитират официални източници.
				</p>
			</section>

			{/* Мисия */}
			<section className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] p-8 sm:p-10 backdrop-blur-2xl">
				<h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-4">Нашата мисия</h2>
				<p className="leading-relaxed text-slate-700 dark:text-slate-300 text-base font-medium">
					Българският фермер работи в изключително сложна регулаторна среда — десетки наредби, кратки срокове,
					хиляди страници документация и европейски директиви. Ние вярваме, че съвременната AI технология може да опрости това до секунди.
				</p>
				<p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300 text-base font-medium">
					Затова създадохме <span className="font-bold text-emerald-600 dark:text-emerald-400">AgriNexus.Law</span> — първият по рода си агро-правен AI асистент, който разбира дълбокия контекст на българското
					земеделие, отговаря с точни линкове към реални нормативни актове и обединява управлението на стопанството в един интуитивен команден център.
				</p>
			</section>

			{/* Ценности */}
			<section className="mt-14">
				<h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Какво ни отличава</h2>
				<div className="grid gap-5 sm:grid-cols-2">
					{values.map((v) => (
						<div key={v.title} className="card-hover-pro glass-panel-pro rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex gap-5 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1">
							<div className="shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 h-fit text-emerald-600 dark:text-emerald-400 shadow-sm">
								<v.icon size={24} />
							</div>
							<div>
								<h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{v.title}</h3>
								<p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">{v.desc}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Екип */}
			<section className="mt-16">
				<h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Нашият AI Екип</h2>
				<p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-400">
					Трима автономни агро персонажи, създадени с експертизата на водещи български агрономи, юристи и софтуерни инженери.
				</p>
				<div className="mt-6 grid gap-6 sm:grid-cols-3">
					{team.map((m) => (
						<div key={m.name} className="card-hover-pro glass-panel-pro rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between">
							<div>
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-lg font-extrabold text-white shadow-md shadow-emerald-500/25 mb-4 animate-float">
									{m.initials}
								</div>
								<h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{m.name}</h3>
								<div className="inline-block mt-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
									{m.role}
								</div>
								<p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{m.bio}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* История */}
			<section className="mt-16">
				<h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">История и развитие</h2>
				<div className="glass-panel-pro rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm overflow-hidden">
					{milestones.map((m) => (
						<div key={m.year} className="flex items-center gap-5 p-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
							<span className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm">
								{m.year}
							</span>
							<p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug">{m.event}</p>
						</div>
					))}
				</div>
			</section>

			{/* Доверие + CTA */}
			<section className="glass-panel-pro mt-16 rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 p-8 text-center sm:p-12 text-white shadow-[0_24px_60px_-15px_rgba(16,185,129,0.3)] relative overflow-hidden">
				<div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
				<CheckCircle size={40} className="mx-auto text-emerald-400 animate-pulse" />
				<h2 className="mt-4 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
					Готови ли сте да дигитализирате стопанството си?
				</h2>
				<p className="mt-3 text-base text-slate-300 font-medium max-w-xl mx-auto">
					Започнете напълно безплатно — без кредитна карта, без ангажимент, с пълен достъп до AI чата.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-4">
					<Link
						href="/vhod"
						className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-fuchsia-600 px-8 py-4 font-extrabold text-white text-base transition-all shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
					>
						<span>Създайте безплатен акаунт</span>
						<ArrowRight size={18} />
					</Link>
					<Link
						href="/ceni"
						className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-extrabold text-white transition-all hover:bg-white/20 backdrop-blur-md"
					>
						<span>Вижте абонаментните планове</span>
					</Link>
				</div>
			</section>

			{/* Footer disclaimer */}
			<p className="mt-10 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
				AgriNexus.Law е платформа с AI асистенти. Информацията и изчисленията не заместват официално юридическо или счетоводно становище.
			</p>
		</SitePageShell>
	);
}
