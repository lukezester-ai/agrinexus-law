"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, MapPin, Wheat, Sprout, CircleCheck, Map, Package, Landmark, FlaskConical, Tractor, Combine, Repeat2, RefreshCw, ArrowRight, Users, Bell, Receipt, FileText as FileTextIcon, TrendingUp, FileSignature, Shield } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import {
	loadFarmProfile,
	persistFarmProfile,
	type FarmProfileSnapshot,
} from "@/lib/farm-profile";

const REGIONS = [
	"Благоевград", "Бургас", "Варна", "Велико Търново", "Видин", "Враца",
	"Габрово", "Добрич", "Кърджали", "Кюстендил", "Ловеч", "Монтана",
	"Пазарджик", "Перник", "Плевен", "Пловдив", "Разград", "Русе",
	"Силистра", "Сливен", "Смолян", "София", "Стара Загора", "Търговище",
	"Хасково", "Шумен", "Ямбол",
];

const MODULES = [
	{ href: "/moya-ferma/polita", label: "Парцели", desc: "Карта на полетата и физически блокове", icon: Map, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
	{ href: "/moya-ferma/sklad", label: "Склад", desc: "Наличности и материални запаси", icon: Package, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50" },
	{ href: "/moya-ferma/schetovodstvo", label: "Счетоводство", desc: "Журнал, фактури, баланс и ДДС", icon: Landmark, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50" },
	{ href: "/moya-ferma/mashini", label: "Машини", desc: "Трактори, комбайни, сеялки и поддръжка", icon: Tractor, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/50" },
	{ href: "/moya-ferma/rekolta", label: "Реколта", desc: "Добиви, площи и качествени показатели", icon: Combine, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50" },
	{ href: "/moya-ferma/seitbooborot", label: "Сеитбооборот", desc: "Планиране и съвместимост на култури", icon: Repeat2, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/50" },
	{ href: "/moya-ferma/himizacia", label: "Химизация", desc: "БАБХ дневник на продуктите за РЗ", icon: FlaskConical, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50" },
	{ href: "/moya-ferma/kalendar", label: "Календар", desc: "График на събития, напомняния и задачи", icon: RefreshCw, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50" },
	{ href: "/moya-ferma/banki", label: "Банки", desc: "Банкови сметки, транзакции и импорт", icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/50" },
	{ href: "/moya-ferma/dma", label: "ДМА", desc: "Дълготрайни материални активи и амортизация", icon: Package, color: "text-stone-600", bg: "bg-stone-100 dark:bg-stone-900/50" },
	{ href: "/moya-ferma/choveшки-ресурси", label: "Човешки ресурси", desc: "Служители, присъствие, отпуски и ведомости", icon: Users, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50" },
	{ href: "/moya-ferma/dokumenti", label: "Документи", desc: "Хранилище за договори, ДФЗ, протоколи и файлове", icon: FileTextIcon, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/50" },
	{ href: "/moya-ferma/subsidii", label: "Субсидии", desc: "ДФЗ схеми и заявления за субсидиране", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/50" },
	{ href: "/moya-ferma/dogovori", label: "Договори", desc: "Шаблони и генерация на договори с контрагенти", icon: FileSignature, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/50" },
	{ href: "/moya-ferma/zastrahovki", label: "Застраховки", desc: "Полици и щети за реколта, машини, служители", icon: Shield, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/50" },
];

export default function MoyaFermaPage() {
	const [profile, setProfile] = useState({
		region: "",
		cropsText: "",
		is_organic: false,
	});
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		const snap = loadFarmProfile();
		if (snap) {
			setProfile({
				region: snap.region,
				cropsText: snap.crops?.join(", ") ?? "",
				is_organic: snap.is_organic,
			});
		}
	}, []);

	const [kpi, setKpi] = useState<any>(null);
	const [kpiLoading, setKpiLoading] = useState(true);

	useEffect(() => {
		fetch('/api/farm/dashboard')
			.then(r => r.json())
			.then(d => setKpi(d))
			.catch(() => {})
			.finally(() => setKpiLoading(false));
	}, []);

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		const snapshot: FarmProfileSnapshot = {
			farm_type: "",
			region: profile.region.trim(),
			total_decares: 0,
			crops: profile.cropsText
				.split(",")
				.map((c) => c.trim())
				.filter(Boolean),
			livestock: [],
			is_organic: profile.is_organic,
		};
		persistFarmProfile(snapshot);
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};

	const KPI_CARDS = [
		{ key: "fields", label: "Парцели", value: kpi?.fields ? `${kpi.fields.total} бр. / ${kpi.fields.area} дка` : "-", icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
		{ key: "inventory", label: "Склад", value: kpi?.inventory ? `${kpi.inventory.totalItems} артикула${kpi.inventory.lowStock > 0 ? `, ${kpi.inventory.lowStock} под мин.` : ""}` : "-", icon: Package, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50" },
		{ key: "employees", label: "Служители", value: kpi?.employees ? `${kpi.employees.active} активни` : "-", icon: Users, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50" },
		{ key: "harvest", label: "Реколта (т.), тазгодишна", value: kpi?.harvest ? `${(Number(kpi.harvest.currentYear) / 1000).toFixed(2)} т` : "-", icon: Combine, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50" },
		{ key: "machines", label: "Машини", value: kpi?.machines ? `${kpi.machines.total} активни` : "-", icon: Tractor, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/50" },
		{ key: "invoices", label: "Фактури (чакащи)", value: kpi?.invoices ? `${kpi.invoices.pending} неизплатени` : "-", icon: Receipt, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50" },
	];

	return (
		<SitePageShell
			maxWidth="4xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Моята ферма</p>
				</div>
			}
		>
			<div className="glass-panel-pro overflow-hidden rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.2)] transition-all">
				<div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 p-6 sm:p-8 text-white relative overflow-hidden">
					<div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
					<h2 className="font-extrabold flex items-center gap-3 text-2xl sm:text-3xl text-white tracking-tight">
						<Sprout className="text-white" size={28} /> Моят Агро-Правен Профил
					</h2>
					<p className="mt-2 text-sm text-emerald-100/90 font-medium max-w-2xl">
						Тези данни захранват директно <span className="underline font-bold">AI асистента Елена</span> за 100% персонализирани отговори за вашите култури и регион.
					</p>
				</div>

				<form onSubmit={handleSave} className="grid gap-6 p-6 sm:p-8 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
							<Wheat size={18} className="text-emerald-600" /> Отглеждани култури
						</label>
						<input
							value={profile.cropsText}
							onChange={(e) => setProfile({ ...profile, cropsText: e.target.value })}
							placeholder="Пшеница, Слънчоглед, Царевица, Лавандула..."
							className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 px-5 py-3.5 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400"
						/>
					</div>

					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
							<MapPin size={18} className="text-teal-600" /> Регион / Област на стопанството
						</label>
						<select
							value={profile.region}
							onChange={(e) => setProfile({ ...profile, region: e.target.value })}
							className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 px-5 py-3.5 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400"
						>
							<option value="">Избери област</option>
							{REGIONS.map((r) => (
								<option key={r} value={r}>{r}</option>
							))}
						</select>
					</div>

					<label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:bg-emerald-50/50 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800">
						<input
							type="checkbox"
							checked={profile.is_organic}
							onChange={(e) => setProfile({ ...profile, is_organic: e.target.checked })}
							className="h-6 w-6 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<div>
							<span className="block text-base font-extrabold text-slate-900 dark:text-white">Биологично производство</span>
							<span className="block text-xs text-slate-500">Активира специфичен анализ на БАБХ и екосхеми за био-земеделие</span>
						</div>
					</label>

					{saved && (
						<div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 shadow-sm animate-bounce dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
							<CircleCheck size={20} className="text-emerald-600 dark:text-emerald-400" /> Профилът е успешно запазен — AI чатът вече използва вашите данни!
						</div>
					)}

					<button
						type="submit"
						className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 px-8 py-4 font-extrabold text-white text-lg shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
					>
						<Save size={20} /> Запази и синхронизирай профила
					</button>
				</form>
			</div>

			<div className="mt-12">
				<div className="flex items-center justify-between mb-6">
					<h3 className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
						<span>Преглед на ключови показатели (KPIs)</span>
					</h3>
					<span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Активен синхрон</span>
				</div>
				{kpiLoading ? (
					<div className="grid gap-5 sm:grid-cols-3">
						{[1,2,3,4,5,6].map(i => (
							<div key={i} className="animate-pulse rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
								<div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
								<div className="mt-4 h-7 w-24 rounded bg-slate-200 dark:bg-slate-800" />
								<div className="mt-2 h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
							</div>
						))}
					</div>
				) : (
					<div className="grid gap-5 sm:grid-cols-3">
						{KPI_CARDS.map(c => (
							<div key={c.key} className="card-hover-pro glass-panel-pro rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/90">
								<div className="flex items-start justify-between">
									<div className={`rounded-2xl ${c.bg} p-3.5 shadow-sm`}>
										<c.icon size={26} className={c.color} />
									</div>
								</div>
								<p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{c.value}</p>
								<p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{c.label}</p>
							</div>
						))}
						{kpi?.upcoming && kpi.upcoming.length > 0 && (
							<div className="card-hover-pro glass-panel-pro rounded-[24px] border border-rose-200/80 bg-rose-50/50 p-6 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30">
								<div className="flex items-start justify-between">
									<div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3.5">
										<Bell size={26} className="text-rose-600 dark:text-rose-400" />
									</div>
								</div>
								<div className="mt-4 space-y-2">
									{kpi.upcoming.slice(0, 3).map((e: any) => (
										<p key={e.id} className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
											<span>{e.title}</span>
										</p>
									))}
								</div>
								<p className="mt-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Предстоящи събития</p>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="mt-14">
				<div className="mb-6">
					<h3 className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
						Всички 15 модула за управление на фермата
					</h3>
					<p className="text-sm text-slate-500 mt-1">Изберете модул за пълен достъп, експорти и автоматични дневници.</p>
				</div>
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{MODULES.map((m) => (
						<Link key={m.href} href={m.href}
							style={{ textDecoration: 'none' }}
							className="card-hover-pro group rounded-[24px] border border-slate-200/90 bg-white/95 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-400 flex flex-col justify-between"
						>
							<div>
								<div className="flex items-start justify-between mb-4">
									<div className={`rounded-2xl ${m.bg} p-3.5 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
										<m.icon size={26} className={m.color} />
									</div>
									<div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-white">
										<ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
									</div>
								</div>
								<h4 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{m.label}</h4>
								<p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
							</div>
						</Link>
					))}
				</div>
			</div>
		</SitePageShell>
	);
}
