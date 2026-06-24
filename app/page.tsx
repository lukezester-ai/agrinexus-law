"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
	ArrowRight,
	BarChart3,
	BookOpenText,
	Calculator,
	CalendarDays,
	CheckCircle2,
	FileSearch,
	Lock,
	MessageSquareText,
	ShieldCheck,
	Sparkles,
	UploadCloud,
} from "lucide-react";

const navLinks = [
	{ label: "Документи", href: "/documents" },
	{ label: "AI преглед", href: "/document-review" },
	{ label: "Срокове", href: "/srokove" },
	{ label: "Калкулатор", href: "/kalkulator" },
	{ label: "Статистики", href: "/statistiki" },
];

const heroActions = [
	{
		title: "Провери срокове",
		body: "Интелигентно проследяване на крайни дати за ДФЗ и активните кампании.",
		href: "/srokove",
		icon: CalendarDays,
		tone: "bg-[#f5f5f7] text-[#1d1d1f]",
	},
	{
		title: "Намери документ",
		body: "Пълен архив от наредби, образци и заявления в PDF формат.",
		href: "/documents",
		icon: FileSearch,
		tone: "bg-[#1d1d1f] text-white",
	},
	{
		title: "AI преглед",
		body: "Автоматичен анализ на договори и писма спрямо актуални изисквания.",
		href: "/document-review",
		icon: Sparkles,
		tone: "bg-[#0f766e] text-white",
	},
];

const categories = [
	["Субсидии", "Директни плащания", "/search?q=субсидии"],
	["Закони", "Наредби и укази", "/search?q=закони"],
	["Сертификати", "Био и качество", "/search?q=сертификати"],
	["Био производство", "Еко стандарти", "/search?q=био производство"],
	["Растителна защита", "Дневници и препарати", "/search?q=растителна защита"],
	["Калкулатори", "Бюджет и ДДС", "/kalkulator"],
];

const stats = [
	["12+", "ключови модула"],
	["3", "AI специалиста"],
	["24/7", "достъп до знания"],
	["<1 мин", "до първи отговор"],
];

const comparison = [
	["Намиране на информация", "Веднага", "30-60 мин"],
	["Точен източник", "Да", "Ръчна проверка"],
	["Следваща стъпка", "Ясна", "Неясна"],
	["AI преглед на документ", "Вграден", "Няма"],
];

function SectionLabel({ children }: { children: string }) {
	return (
		<p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
			{children}
		</p>
	);
}

export default function Home() {
	return (
		<main className="min-h-screen bg-white text-[#1d1d1f]">
			<header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-2xl">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
					<Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
						<span className="grid h-8 w-8 place-items-center rounded-full bg-[#1d1d1f] text-white">
							<Sparkles size={16} />
						</span>
						<span>AgriNexus.Law</span>
					</Link>

					<nav className="hidden items-center gap-7 text-sm text-[#6e6e73] lg:flex">
						{navLinks.map((link) => (
							<Link key={link.href} href={link.href} className="transition-colors hover:text-[#1d1d1f]">
								{link.label}
							</Link>
						))}
					</nav>

					<Link
						href="/vhod"
						className="rounded-full bg-[#1d1d1f] px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
					>
						Вход
					</Link>
				</div>
			</header>

			<section className="relative overflow-hidden px-5 py-20 text-center sm:px-8 lg:py-28">
				<div className="absolute left-1/2 top-12 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.16),transparent_65%)]" />
				<div className="relative mx-auto max-w-6xl">
					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#6e6e73] shadow-sm">
							<span className="h-2 w-2 rounded-full bg-[#30d158]" />
							Официални данни, AI насоки и фермерски инструменти
						</div>

						<h1 className="mx-auto max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
							Отговори за
							<br />
							вашето стопанство.
						</h1>

						<p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#6e6e73] sm:text-xl">
							Търсете субсидии, договори и срокове на едно място. Ясни отговори с точен източник.
						</p>

						<div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
							<Link
								href="/document-review"
								className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071e3] px-7 py-3 text-base font-semibold text-white transition-transform hover:scale-[1.02]"
							>
								Питай AI <ArrowRight size={18} />
							</Link>
							<Link
								href="/documents"
								className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5f5f7] px-7 py-3 text-base font-semibold text-[#1d1d1f] transition-transform hover:scale-[1.02]"
							>
								Виж документи
							</Link>
						</div>
					</motion.div>

					<div className="mt-16 grid gap-4 md:grid-cols-3">
						{heroActions.map((action, index) => {
							const Icon = action.icon;
							return (
								<motion.div
									key={action.href}
									initial={{ opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: index * 0.08, duration: 0.45 }}
								>
									<Link
										href={action.href}
										className={`group flex min-h-[250px] flex-col justify-between rounded-[2rem] p-7 text-left transition-transform hover:-translate-y-1 ${action.tone}`}
									>
										<Icon size={32} />
										<div>
											<h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em]">{action.title}</h2>
											<p className="text-base leading-7 opacity-75">{action.body}</p>
										</div>
										<span className="inline-flex items-center gap-2 text-sm font-semibold">
											Виж всички <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
										</span>
									</Link>
								</motion.div>
							);
						})}
					</div>
				</div>
			</section>

			<section className="border-y border-black/5 bg-[#f5f5f7] px-5 py-5 sm:px-8">
				<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-[#6e6e73]">
					<span className="text-[#ff3b30]">Активно: директни плащания</span>
					<span>Еко-схеми: нов прием</span>
					<span>Документи: дневници и заявления</span>
					<span className="text-[#0f766e]">RAG база: включена</span>
				</div>
			</section>

			<section className="px-5 py-24 sm:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
						<div>
							<SectionLabel>Как работи</SectionLabel>
							<h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
								Три стъпки до отговора.
							</h2>
							<p className="mt-5 text-lg leading-8 text-[#6e6e73]">
								Без PDF-та, без търсене по сайтове.
							</p>
						</div>
						<div className="grid gap-4">
							{[
								["1", "Задай въпрос", "Напиши казуса си на разговорен български."],
								["2", "AI търси в документите", "Системата проверява база от наредби, срокове и вътрешни знания."],
								["3", "Получи следваща стъпка", "Отговорът е кратък, практичен и насочва към действие."],
							].map(([num, title, body]) => (
								<div key={num} className="flex gap-5 rounded-3xl bg-[#f5f5f7] p-6">
									<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-semibold text-[#0071e3]">
										{num}
									</span>
									<div>
										<h3 className="text-xl font-semibold">{title}</h3>
										<p className="mt-2 leading-7 text-[#6e6e73]">{body}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="bg-black px-5 py-24 text-white sm:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="mb-14 text-center">
						<p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Модули</p>
						<h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
							Всичко важно за стопанството.
						</h2>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[
							["Календар", "Сезонни задачи по култури", "/kalendar", CalendarDays],
							["Калкулатор", "Ориентировъчни субсидии", "/kalkulator", Calculator],
							["Статистики", "Култури, добиви и сравнения", "/statistiki", BarChart3],
							["Документи", "Библиотека от източници", "/documents", BookOpenText],
							["Търсене", "Бърза справка по тема", "/search", FileSearch],
							["Моя ферма", "Профил и персонализация", "/moya-ferma", ShieldCheck],
						].map(([title, body, href, Icon]) => (
							<Link key={href as string} href={href as string} className="group rounded-[1.75rem] bg-white/[0.08] p-6 transition-colors hover:bg-white/[0.13]">
								<Icon className="mb-10 text-white/75" size={28} />
								<h3 className="text-2xl font-semibold tracking-[-0.03em]">{title as string}</h3>
								<p className="mt-3 leading-7 text-white/55">{body as string}</p>
							</Link>
						))}
					</div>
				</div>
			</section>

			<section className="px-5 py-24 sm:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{stats.map(([value, label]) => (
							<div key={label} className="rounded-[1.75rem] bg-[#f5f5f7] p-7">
								<p className="text-4xl font-semibold tracking-[-0.04em]">{value}</p>
								<p className="mt-3 text-sm text-[#6e6e73]">{label}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-[#f5f5f7] px-5 py-24 sm:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="mb-12">
						<SectionLabel>Бърз достъп</SectionLabel>
						<h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
							Бърз достъп до най-честите казуси.
						</h2>
						<p className="mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">
							Открийте бързи отговори в систематизирана база.
						</p>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{categories.map(([title, subtitle, href]) => (
							<Link key={title} href={href} className="group rounded-3xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
								<h3 className="text-xl font-semibold">{title}</h3>
								<p className="mt-2 text-[#6e6e73]">{subtitle}</p>
								<span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0071e3]">
									Отвори <ArrowRight className="transition-transform group-hover:translate-x-1" size={15} />
								</span>
							</Link>
						))}
					</div>
				</div>
			</section>

			<section className="px-5 py-24 sm:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
						<div>
							<SectionLabel>Сравнение</SectionLabel>
							<h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
								По-малко търсене. Повече яснота.
							</h2>
							<p className="mt-6 text-lg leading-8 text-[#6e6e73]">
								Вместо да прескачаш между сайтове, PDF-и и стари бележки, започваш от един център.
							</p>
						</div>

						<div className="overflow-hidden rounded-[2rem] border border-black/10">
							<div className="grid grid-cols-3 bg-[#f5f5f7] p-4 text-sm font-semibold">
								<span>Функция</span>
								<span>AgriNexus</span>
								<span>Ръчно</span>
							</div>
							{comparison.map(([feature, agri, manual]) => (
								<div key={feature} className="grid grid-cols-3 border-t border-black/10 p-4 text-sm">
									<span>{feature}</span>
									<span className="font-semibold text-[#0071e3]">{agri}</span>
									<span className="text-[#6e6e73]">{manual}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="bg-black px-5 py-24 text-white sm:px-8">
				<div className="mx-auto max-w-6xl text-center">
					<p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Доверие</p>
					<h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
						Всеки отговор трябва да бъде проверим.
					</h2>
					<div className="mt-14 grid gap-4 md:grid-cols-3">
						{[
							[CheckCircle2, "Официални източници", "Фокус върху документи и наредби, не върху слухове."],
							[Lock, "Защита на данните", "Файловете и профилите се третират като чувствителна информация."],
							[UploadCloud, "Готово за развитие", "RAG, документи, профил на ферма и мобилна обвивка."],
						].map(([Icon, title, body]) => (
							<div key={title as string} className="rounded-[1.75rem] bg-white/[0.08] p-7 text-left">
								<Icon className="mb-8 text-white/60" size={28} />
								<h3 className="text-xl font-semibold">{title as string}</h3>
								<p className="mt-3 leading-7 text-white/55">{body as string}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="px-5 py-24 sm:px-8">
				<div className="mx-auto max-w-6xl rounded-[2.5rem] bg-[#f5f5f7] p-8 sm:p-12 lg:p-16">
					<div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
						<div>
							<SectionLabel>AI асистент</SectionLabel>
							<h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
								Задай въпрос към специалист.
							</h2>
							<p className="mt-6 text-lg leading-8 text-[#6e6e73]">
								Право, поле и финанси - три гледни точки за по-практични решения.
							</p>
						</div>
						<div className="rounded-[2rem] bg-white p-5 shadow-sm">
							<div className="mb-5 flex gap-3 border-b border-black/10 pb-4 text-sm font-semibold text-[#6e6e73]">
								<span className="text-[#1d1d1f]">Право</span>
								<span>Поле</span>
								<span>Финанси</span>
							</div>
							<div className="rounded-2xl bg-[#f5f5f7] p-6 text-[#6e6e73]">
								<MessageSquareText className="mb-5 text-[#0071e3]" />
								<p>Напиши казус: култура, регион, документ или срок.</p>
							</div>
							<Link href="/document-review" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 font-semibold text-white">
								Започни AI преглед <ArrowRight size={18} />
							</Link>
						</div>
					</div>
				</div>
			</section>

			<footer className="border-t border-black/10 px-5 py-8 text-sm text-[#6e6e73] sm:px-8">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
					<p>Copyright 2026 AgriNexus.Law. Всички права запазени.</p>
					<div className="flex flex-wrap justify-center gap-5">
						<Link href="/privacy">Поверителност</Link>
						<Link href="/terms">Условия</Link>
						<Link href="/vhod">Вход</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
