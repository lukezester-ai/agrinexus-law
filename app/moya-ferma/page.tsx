"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, MapPin, Wheat, Sprout, CircleCheck, Map, Package, Landmark, FlaskConical, Tractor, Combine, Repeat2, RefreshCw, ArrowRight, Users } from "lucide-react";
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
	{ href: "/moya-ferma/choveшки-ресурси", label: "Човешки ресурси", desc: "Служители, присъствие, отпуски и ведомости", icon: Users, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50" },
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

	return (
		<SitePageShell
			maxWidth="4xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Моята ферма</p>
				</div>
			}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				{MODULES.map((m) => (
					<Link key={m.href} href={m.href}
						className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
					>
						<div className="flex items-start justify-between">
							<div className={`rounded-xl ${m.bg} p-3`}>
								<m.icon size={24} className={m.color} />
							</div>
							<ArrowRight size={18} className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-slate-600" />
						</div>
						<h3 className="mt-3 font-bold text-slate-900 dark:text-white">{m.label}</h3>
						<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.desc}</p>
					</Link>
				))}
			</div>

			<div className="mt-6 glass-panel overflow-hidden rounded-3xl">
				<div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
					<h2 className="font-display flex items-center gap-3 text-xl font-medium text-slate-950 dark:text-white">
						<Sprout className="text-teal-600 dark:text-teal-400" /> Моят профил
					</h2>
					<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
						Тези данни се споделят с AI чата за персонализирани отговори.
					</p>
				</div>

				<form onSubmit={handleSave} className="grid gap-5 p-6">
					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
							<Wheat size={16} className="text-emerald-600" /> Отглеждани култури
						</label>
						<input
							value={profile.cropsText}
							onChange={(e) => setProfile({ ...profile, cropsText: e.target.value })}
							placeholder="Пшеница, Слънчоглед, Царевица..."
							className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white"
						/>
					</div>

					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
							<MapPin size={16} className="text-teal-600" /> Регион
						</label>
						<select
							value={profile.region}
							onChange={(e) => setProfile({ ...profile, region: e.target.value })}
							className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white"
						>
							<option value="">Избери област</option>
							{REGIONS.map((r) => (
								<option key={r} value={r}>{r}</option>
							))}
						</select>
					</div>

					<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
						<input
							type="checkbox"
							checked={profile.is_organic}
							onChange={(e) => setProfile({ ...profile, is_organic: e.target.checked })}
							className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<span className="text-sm font-bold text-slate-900 dark:text-white">Биологично производство</span>
					</label>

					{saved && (
						<div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-800 dark:border-teal-800/50 dark:bg-teal-900/30 dark:text-teal-300">
							<CircleCheck size={18} /> Запазено — AI чатът го използва веднага.
						</div>
					)}

					<button
						type="submit"
						className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-100"
					>
						<Save size={18} /> Запази профила
					</button>
				</form>
			</div>
		</SitePageShell>
	);
}
