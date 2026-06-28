"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, MapPin, Wheat, Sprout, CircleCheck } from "lucide-react";
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
			maxWidth="2xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Моята ферма</p>
					<Link href="/profile" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
						Пълен профил →
					</Link>
				</div>
			}
		>
			<div className="glass-panel overflow-hidden rounded-3xl">
				<div className="border-b border-white/10 bg-teal-50/50 p-8 dark:bg-teal-950/20">
					<h1 className="font-display flex items-center gap-3 text-3xl font-medium text-slate-950 dark:text-white">
						<Sprout className="text-teal-600 dark:text-teal-400" /> Моята ферма
					</h1>
					<p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
						Данните се споделят с AI чата и калкулатора (единен профил в браузъра).
					</p>
				</div>

				<form onSubmit={handleSave} className="grid gap-6 p-6">
					<div className="space-y-3">
						<label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
							<Wheat size={18} className="text-emerald-600" /> Отглеждани култури
						</label>
						<input
							value={profile.cropsText}
							onChange={(e) => setProfile({ ...profile, cropsText: e.target.value })}
							placeholder="Напр. Пшеница, Слънчоглед, Царевица..."
							className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white"
						/>
						<p className="text-xs text-slate-500">Разделени със запетая.</p>
					</div>

					<div className="space-y-3">
						<label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
							<MapPin size={18} className="text-teal-600" /> Регион / Област
						</label>
						<select
							value={profile.region}
							onChange={(e) => setProfile({ ...profile, region: e.target.value })}
							className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white"
						>
							<option value="">Избери област</option>
							{REGIONS.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
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
						<div>
							<span className="block text-sm font-bold text-slate-900 dark:text-white">
								Биологично производство
							</span>
							<span className="text-xs text-slate-500">Отбелязва се в AI персонализацията.</span>
						</div>
					</label>

					{saved && (
						<div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-800 dark:border-teal-800/50 dark:bg-teal-900/30 dark:text-teal-300">
							<CircleCheck size={18} /> Профилът е запазен — чатът го използва веднага.
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
