"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Plus, 
  Save, 
  Trash2, 
  Loader2, 
  X, 
  Search, 
  FileText, 
  Sprout, 
  Apple, 
  Calendar, 
  Users, 
  CheckCircle2, 
  TrendingUp,
  Award,
  AlertCircle,
  ThermometerSnowflake,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrchardParcel = {
  id: string;
  name: string;
  cropType: string;
  variety: string;
  rootstock: string;
  areaDecares: number;
  plantingYear: number;
  fruitBearingStatus: "young_growing" | "full_bearing" | "old_replanting";
  plantingScheme: string;
  irrigationType: "drip" | "sprinkler" | "none";
  accountingAccount: "272" | "204" | "611";
  notes?: string;
};

type HarvestWorkerLog = {
  id: string;
  workerName: string;
  egnOrIdNumber: string;
  date: string;
  parcelName: string;
  binsCount: number;
  totalKg: number;
  class1Kg: number;
  class2Kg: number;
  industrialKg: number;
  ratePerKg: number;
  totalPaidBgn: number;
  contractArticle114aRegistered: boolean;
};

const DEMO_ORCHARDS: OrchardParcel[] = [
  {
    id: "orch-1",
    name: "Масив Череши - Камен дол",
    cropType: "Череши",
    variety: "Бигaро Бурла (Bigarreau Burlat) & Кордия",
    rootstock: "Гизела 6 (Gisela 6)",
    areaDecares: 120,
    plantingYear: 2020,
    fruitBearingStatus: "full_bearing",
    plantingScheme: "4.0 х 2.0 м (125 дръвчета/дка)",
    irrigationType: "drip",
    accountingAccount: "272",
    notes: "Встъпило в пълно плододаване през 2023 г. Сметка 272 Биологични активи"
  },
  {
    id: "orch-2",
    name: "Масив Ябълки - Горна Слатина",
    cropType: "Ябълки",
    variety: "Фуджи (Fuji) & Грани Смит (Granny Smith)",
    rootstock: "М9 (Интензивна подложка)",
    areaDecares: 180,
    plantingYear: 2022,
    fruitBearingStatus: "full_bearing",
    plantingScheme: "3.5 х 1.2 м (238 дръвчета/дка)",
    irrigationType: "drip",
    accountingAccount: "272",
    notes: "Изградена противоградна мрежа и фертигационен възел"
  },
  {
    id: "orch-3",
    name: "Лозов масив - Шато Бреста",
    cropType: "Винен лозе",
    variety: "Мавруд & Мерло",
    rootstock: "SO4",
    areaDecares: 250,
    plantingYear: 2018,
    fruitBearingStatus: "full_bearing",
    plantingScheme: "2.5 х 1.0 м",
    irrigationType: "none",
    accountingAccount: "204",
    notes: "Регистрирано в ИАЛВ (Изпълнителна агенция по лозата и виното)"
  },
  {
    id: "orch-4",
    name: "Млад Орехов масив - Равнището",
    cropType: "Орехи",
    variety: "Чандлър (Chandler) & Франкет",
    rootstock: "Семенна",
    areaDecares: 310,
    plantingYear: 2024,
    fruitBearingStatus: "young_growing",
    plantingScheme: "8.0 х 8.0 м",
    irrigationType: "drip",
    accountingAccount: "611",
    notes: "Младо насаждение - разходите се натрупват като незавършено строителство (Сметка 611/204)"
  }
];

const DEMO_HARVEST_LOGS: HarvestWorkerLog[] = [
  {
    id: "harv-1",
    workerName: "Иван Петров Георгиев",
    egnOrIdNumber: "8805124419",
    date: "2025-06-12",
    parcelName: "Масив Череши - Камен дол",
    binsCount: 4,
    totalKg: 320,
    class1Kg: 280,
    class2Kg: 30,
    industrialKg: 10,
    ratePerKg: 0.60,
    totalPaidBgn: 192,
    contractArticle114aRegistered: true
  },
  {
    id: "harv-2",
    workerName: "Мария Димитрова Илиева",
    egnOrIdNumber: "9103287712",
    date: "2025-06-12",
    parcelName: "Масив Череши - Камен дол",
    binsCount: 5,
    totalKg: 385,
    class1Kg: 350,
    class2Kg: 25,
    industrialKg: 10,
    ratePerKg: 0.60,
    totalPaidBgn: 231,
    contractArticle114aRegistered: true
  }
];

export default function OvoshtarstvoPage() {
  const [activeTab, setActiveTab] = useState<"orchards" | "harvest_campaign" | "pruning_calendar">("orchards");
  const [orchards, setOrchards] = useState<OrchardParcel[]>(DEMO_ORCHARDS);
  const [harvestLogs, setHarvestLogs] = useState<HarvestWorkerLog[]>(DEMO_HARVEST_LOGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showOrchForm, setShowOrchForm] = useState(false);
  const [showHarvForm, setShowHarvForm] = useState(false);

  // Orchard Form
  const [orchForm, setOrchForm] = useState({
    name: "",
    cropType: "Череши",
    variety: "",
    rootstock: "Гизела 6 / М9",
    areaDecares: 50,
    plantingYear: 2022,
    fruitBearingStatus: "full_bearing" as const,
    plantingScheme: "4.0 х 2.0 м",
    irrigationType: "drip" as const,
    accountingAccount: "272" as const,
    notes: ""
  });

  // Harvest worker form
  const [harvForm, setHarvForm] = useState({
    workerName: "",
    egnOrIdNumber: "",
    date: new Date().toISOString().split("T")[0],
    parcelName: DEMO_ORCHARDS[0].name,
    totalKg: 300,
    class1Kg: 260,
    class2Kg: 30,
    industrialKg: 10,
    ratePerKg: 0.60,
    contractArticle114aRegistered: true
  });

  const handleSaveOrchard = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrch: OrchardParcel = {
      id: `orch-${Date.now()}`,
      ...orchForm
    };
    setOrchards([newOrch, ...orchards]);
    setShowOrchForm(false);
  };

  const handleSaveHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    const totalPaidBgn = harvForm.totalKg * harvForm.ratePerKg;
    const newHarv: HarvestWorkerLog = {
      id: `harv-${Date.now()}`,
      ...harvForm,
      binsCount: Math.ceil(harvForm.totalKg / 80),
      totalPaidBgn
    };
    setHarvestLogs([newHarv, ...harvestLogs]);
    setShowHarvForm(false);
  };

  const handleDeleteOrchard = (id: string) => {
    setOrchards(orchards.filter(o => o.id !== id));
  };

  const totalArea = orchards.reduce((sum, o) => sum + o.areaDecares, 0);
  const totalHarvestedKg = harvestLogs.reduce((sum, h) => sum + h.totalKg, 0);
  const totalPaidHarvest = harvestLogs.reduce((sum, h) => sum + h.totalPaidBgn, 0);

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Овощарство, Лозарство и Трайни насаждения</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              Сметки 272 / 204 • Чл. 114а от КТ (Беритба)
            </span>
          </div>

          <div className="flex flex-wrap rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            <button
              onClick={() => setActiveTab("orchards")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "orchards"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Apple size={14} className="text-rose-500" />
              <span>Кадастър Насаждения ({orchards.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("harvest_campaign")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "harvest_campaign"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Users size={14} className="text-emerald-500" />
              <span>Беритбена Кампания & Чл. 114а</span>
            </button>
            <button
              onClick={() => setActiveTab("pruning_calendar")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "pruning_calendar"
                  ? "bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Calendar size={14} className={activeTab === "pruning_calendar" ? "text-white" : "text-rose-500"} />
              <span>Агро-календар на Резитби & Фертигация</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {activeTab === "orchards" && (
          <>
            {/* Banner Hero */}
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <Sprout size={14} />
                  <span>Трайни насаждения (Сметка 272 / МСС 41)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Управление на Овощни градини, Лозови масиви и Ягодоплодни
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Пълен регистър на сортове, подложки, схеми на засаждане, капково напояване и встъпване в плододаване. Счетоводно отчитане като <strong>Биологични активи (Сметка 272)</strong> или <strong>ДМА (Сметка 204)</strong>.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Обща площ трайни насаждения</span>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalArea.toLocaleString("bg-BG")} дка</p>
                <span className="mt-1 block text-xs font-bold text-slate-500">{orchards.length} овощни и лозови масива</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">В плододаване (Сметка 272)</span>
                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {orchards.filter(o => o.fruitBearingStatus === "full_bearing").reduce((sum, o) => sum + o.areaDecares, 0)} дка
                </p>
                <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Активно плододаване и амортизация</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Млади насаждения (Сметка 611)</span>
                <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                  {orchards.filter(o => o.fruitBearingStatus === "young_growing").reduce((sum, o) => sum + o.areaDecares, 0)} дка
                </p>
                <span className="mt-1 block text-xs font-bold text-slate-500">Натрупване на разходи (3 години)</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-teal-500/40 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">Капково напояване & Фертигация</span>
                <p className="mt-2 text-2xl font-black text-teal-600 dark:text-teal-400">
                  {Math.round((orchards.filter(o => o.irrigationType === "drip").reduce((s, o) => s + o.areaDecares, 0) / totalArea) * 100)}% от площта
                </p>
                <span className="mt-1 block text-xs font-extrabold text-teal-800 dark:text-teal-300">Интензивни агротехнологии</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowOrchForm(!showOrchForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] transition"
              >
                <Plus size={16} />
                <span>{showOrchForm ? "Скрий формата" : "Регистрирай нов овощен или лозов масив"}</span>
              </button>
            </div>

            {showOrchForm && (
              <form onSubmit={handleSaveOrchard} className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Apple size={18} className="text-rose-500" />
                    <span>Регистрация на Трайно насаждение</span>
                  </h3>
                  <button type="button" onClick={() => setShowOrchForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Име на масива</label>
                    <input value={orchForm.name} onChange={(e) => setOrchForm({ ...orchForm, name: e.target.value })} required placeholder="напр. Масив Череши - Камен дол" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Вид култура</label>
                    <select value={orchForm.cropType} onChange={(e) => setOrchForm({ ...orchForm, cropType: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="Череши">Череши</option>
                      <option value="Ябълки">Ябълки</option>
                      <option value="Праскови / Кайсии">Праскови / Кайсии</option>
                      <option value="Сливи">Сливи</option>
                      <option value="Орехи / Лешници">Орехи / Лешници</option>
                      <option value="Винен лозе">Винен лозе</option>
                      <option value="Десертно лозе">Десертно лозе</option>
                      <option value="Малини / Ягоди">Малини / Ягоди</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Сортове & Подложка</label>
                    <input value={orchForm.variety} onChange={(e) => setOrchForm({ ...orchForm, variety: e.target.value })} required placeholder="напр. Бурла на подложка Гизела 6" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Площ (дка)</label>
                    <input type="number" step="0.1" value={orchForm.areaDecares} onChange={(e) => setOrchForm({ ...orchForm, areaDecares: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Година на засаждане</label>
                    <input type="number" value={orchForm.plantingYear} onChange={(e) => setOrchForm({ ...orchForm, plantingYear: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Счетоводно признаване (Сметка)</label>
                    <select value={orchForm.accountingAccount} onChange={(e: any) => setOrchForm({ ...orchForm, accountingAccount: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="272">Сметка 272 (Биологични активи / МСС 41)</option>
                      <option value="204">Сметка 204 (Дълготрайни насаждения / ЗКПО)</option>
                      <option value="611">Сметка 611 / 204 (Младо насаждение до 3 г.)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowOrchForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition">Заведи в кадастъра</button>
                </div>
              </form>
            )}

            {/* Orchards Table */}
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Име на масив</th>
                      <th className="p-4">Култура & Сорт</th>
                      <th className="p-4">Схема на засаждане</th>
                      <th className="p-4 text-right">Площ (дка)</th>
                      <th className="p-4 text-center">Напояване</th>
                      <th className="p-4 text-center">Счетоводна Сметка</th>
                      <th className="p-4 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {orchards.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-black text-slate-900 dark:text-white text-xs">
                          {o.name}
                          <span className="block text-[11px] font-normal text-slate-400">Засаждане: {o.plantingYear} г.</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 block text-xs">{o.cropType}</span>
                          <span className="text-xs text-slate-500 font-medium">{o.variety} ({o.rootstock})</span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">{o.plantingScheme}</td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white">{o.areaDecares} дка</td>
                        <td className="p-4 text-center">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold", o.irrigationType === "drip" ? "bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                            {o.irrigationType === "drip" ? "💧 Капково" : "○ Без напояване"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            С/ка {o.accountingAccount}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteOrchard(o.id)} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "harvest_campaign" && (
          <>
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-3">
                  <Users size={14} />
                  <span>Еднодневни трудови договори • Чл. 114а от КТ</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Кампания „Беритба и Сортиране“ — Отчитане на берачи и добив
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Пълна автоматизация при наемане на сезонни работници на еднодневни договори (чл. 114а от КТ). Отчитане на обрани касетки (кг/ден на работник), сортиране на <strong>Клас I, Клас II и промишлен плод</strong> и калкулация на възнаграждението.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm font-bold text-slate-500">
                Общо обран плод за деня: <strong className="text-emerald-600 font-mono text-base">{totalHarvestedKg.toLocaleString("bg-BG")} кг</strong> • Изплатени заплати: <strong className="text-slate-900 dark:text-white font-mono text-base">{totalPaidHarvest.toFixed(2)} лв</strong>
              </div>

              <button
                onClick={() => setShowHarvForm(!showHarvForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] transition"
              >
                <Plus size={16} />
                <span>{showHarvForm ? "Скрий формата" : "Въведи дневен отчетох за берач"}</span>
              </button>
            </div>

            {showHarvForm && (
              <form onSubmit={handleSaveHarvest} className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-emerald-600" />
                    <span>Дневен кантар на берач (Еднодневен договор по чл. 114а)</span>
                  </h3>
                  <button type="button" onClick={() => setShowHarvForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Име на работник / Берач</label>
                    <input value={harvForm.workerName} onChange={(e) => setHarvForm({ ...harvForm, workerName: e.target.value })} required placeholder="напр. Иван Петров" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">ЕГН / Лична карта</label>
                    <input value={harvForm.egnOrIdNumber} onChange={(e) => setHarvForm({ ...harvForm, egnOrIdNumber: e.target.value })} required placeholder="880512..." className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Овощен масив</label>
                    <select value={harvForm.parcelName} onChange={(e) => setHarvForm({ ...harvForm, parcelName: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      {orchards.map(o => <option key={o.id} value={o.name}>{o.name} ({o.cropType})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Общо обрани (кг)</label>
                    <input type="number" step="0.5" value={harvForm.totalKg} onChange={(e) => setHarvForm({ ...harvForm, totalKg: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Клас I - Екстра качество (кг)</label>
                    <input type="number" step="0.5" value={harvForm.class1Kg} onChange={(e) => setHarvForm({ ...harvForm, class1Kg: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Ставка за кг обран плод (лв/кг)</label>
                    <input type="number" step="0.05" value={harvForm.ratePerKg} onChange={(e) => setHarvForm({ ...harvForm, ratePerKg: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowHarvForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition">Запиши в дневника за деня</button>
                </div>
              </form>
            )}

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Берач / ЕГН</th>
                      <th className="p-4">Масив</th>
                      <th className="p-4 text-right">Обрани (кг)</th>
                      <th className="p-4 text-right">Сортиране (Клас I / II / Промишлен)</th>
                      <th className="p-4 text-right">Ставка</th>
                      <th className="p-4 text-right">Изплатено (лв)</th>
                      <th className="p-4 text-center">Договор чл. 114а</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {harvestLogs.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-black text-slate-900 dark:text-white text-xs">
                          {h.workerName}
                          <span className="block text-[11px] font-mono text-slate-400">ЕГН: {h.egnOrIdNumber}</span>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-400">{h.parcelName}</td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white font-mono">{h.totalKg} кг ({h.binsCount} бина)</td>
                        <td className="p-4 text-right text-xs">
                          <span className="text-emerald-600 font-extrabold">{h.class1Kg} кг Кл. I</span> / <span className="text-amber-600">{h.class2Kg} кг Кл. II</span>
                        </td>
                        <td className="p-4 text-right font-mono text-xs">{h.ratePerKg.toFixed(2)} лв/кг</td>
                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">{h.totalPaidBgn.toFixed(2)} лв</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            ✔ Регистриран в НАП
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "pruning_calendar" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-fuchsia-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
                  <Calendar size={14} />
                  <span>Фенофази, Зимна Резитба & Капково фертигиране</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Годишен Агро-Технологичен календар за Трайни насаждения
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Овощарството и лозарството изискват строг тайминг на операциите: от зимна резитба за формиране и плододаване през пролетно третиране срещу късно измръзване до прецизна фертигация по фенофази.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-wider">
                  <Calendar size={16} /> Зима (Януари — Март)
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Зимна резитба и зимно пръскане</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Основни формировки: Подобрена етажна корона за череши и Вретено за ябълки. Зимно пръскане с меден препарат и минерално масло (Сметка 601 Материали).
                </p>
                <div className="rounded-2xl bg-rose-500/10 p-3 text-xs font-extrabold text-rose-800 dark:text-rose-300 border border-rose-500/20">
                  ✔ Контрол на натоварването с плодни пъпки<br />
                  ✔ Защита от късни слани
                </div>
              </div>

              <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider">
                  <Sprout size={16} /> Пролет (Април — Юни)
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Цъфтеж, Завръз и Фертигация</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Внасяне на водоразтворими NPK торове и микроелементи (Бор, Калций) чрез капковата система за предотвратяване на напукване на плода и горчива петнистост.
                </p>
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  ✔ Капкова фертигация по график<br />
                  ✔ Пръскания при стриктна карентна грижа преди беритба
                </div>
              </div>

              <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider">
                  <Apple size={16} /> Лято и Есен (Юли — Окт.)
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Беритба, Сортиране и Хладилно съхранение</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Масова беритбена кампания. Завеждане на готовата продукция по Сметка 303 (Готова продукция) и реализация към търговски вериги или преработватели.
                </p>
                <div className="rounded-2xl bg-amber-500/10 p-3 text-xs font-extrabold text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  ✔ Оптимална температура на съхранение (0.5°C)<br />
                  ✔ Експорт на сертификати за качество
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
