"use client";

import { useState } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Plus, 
  Save, 
  Trash2, 
  Loader2, 
  X, 
  Search, 
  FileText, 
  Award, 
  Bug, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  ShieldCheck,
  Droplets,
  Calendar,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

type ApiaryRegistry = {
  id: string;
  vetIsNumber: string;
  name: string;
  locationAddress: string;
  hivesCount: number;
  hiveType: "dadan_blat" | "langstroth_ruth" | "farrar";
  isOrganicCertified: boolean;
  certifyingBody?: string;
  lastInspectionDate: string;
  notes?: string;
};

type BeeHarvestLog = {
  id: string;
  apiaryId: string;
  apiaryName: string;
  date: string;
  honeyType: "acacia" | "linden" | "polyfloral" | "honeydew" | "sunflower";
  harvestKg: number;
  moisturePercent: number;
  batchNumber: string;
  labTestStatus: "passed" | "pending" | "failed";
  accountingAccount: "303";
};

type BeeVetLog = {
  id: string;
  apiaryName: string;
  date: string;
  treatmentType: "varroa_spring" | "varroa_autumn" | "nosema" | "feeding";
  medicationOrSubstance: string;
  isOrganicApproved: boolean;
  hivesTreatedCount: number;
  vetNotes?: string;
};

const DEMO_APIARIES: ApiaryRegistry[] = [
  {
    id: "api-1",
    vetIsNumber: "6140-0192",
    name: "Горски Пчелин - Ливадите",
    locationAddress: "землище с. Горна Слатина (в близост до акациева гора)",
    hivesCount: 85,
    hiveType: "dadan_blat",
    isOrganicCertified: true,
    certifyingBody: "Балкан Биосерт ООД",
    lastInspectionDate: "2025-05-14",
    notes: "Сертифициран биологичен пчелин по Регламент (ЕС) 2018/848"
  },
  {
    id: "api-2",
    vetIsNumber: "6140-0344",
    name: "Полеви Пчелин - Равнището",
    locationAddress: "землище с. Камен дол (до слънчогледови масиви)",
    hivesCount: 110,
    hiveType: "langstroth_ruth",
    isOrganicCertified: false,
    lastInspectionDate: "2025-06-02",
    notes: "Многокорпусна система Лангстрот-Рут за интензивен медосбор"
  }
];

const DEMO_BEE_HARVEST: BeeHarvestLog[] = [
  {
    id: "harv-b-1",
    apiaryId: "api-1",
    apiaryName: "Горски Пчелин - Ливадите",
    date: "2025-06-18",
    honeyType: "acacia",
    harvestKg: 1420,
    moisturePercent: 17.4,
    batchNumber: "ПАРТ-АКАЦ-2025/01",
    labTestStatus: "passed",
    accountingAccount: "303"
  },
  {
    id: "harv-b-2",
    apiaryId: "api-2",
    apiaryName: "Полеви Пчелин - Равнището",
    date: "2025-08-04",
    honeyType: "sunflower",
    harvestKg: 2850,
    moisturePercent: 18.1,
    batchNumber: "ПАРТ-СЛЪНЧ-2025/02",
    labTestStatus: "passed",
    accountingAccount: "303"
  }
];

const DEMO_BEE_VET: BeeVetLog[] = [
  {
    id: "vet-b-1",
    apiaryName: "Горски Пчелин - Ливадите",
    date: "2025-04-10",
    treatmentType: "varroa_spring",
    medicationOrSubstance: "Оксалова киселина + Тимол (Апивита)",
    isOrganicApproved: true,
    hivesTreatedCount: 85,
    vetNotes: "Успешно третиране срещу Вароатоза без синтетични пиретроиди"
  }
];

export default function PchelarstvoPage() {
  const [activeTab, setActiveTab] = useState<"apiaries" | "honey_harvest" | "vet_varroa">("apiaries");
  const [apiaries, setApiaries] = useState<ApiaryRegistry[]>(DEMO_APIARIES);
  const [harvests, setHarvests] = useState<BeeHarvestLog[]>(DEMO_BEE_HARVEST);
  const [vetLogs, setVetLogs] = useState<BeeVetLog[]>(DEMO_BEE_VET);
  const [showApiForm, setShowApiForm] = useState(false);
  const [showHarvForm, setShowHarvForm] = useState(false);

  const [apiForm, setApiForm] = useState({
    vetIsNumber: "",
    name: "",
    locationAddress: "",
    hivesCount: 50,
    hiveType: "dadan_blat" as const,
    isOrganicCertified: true,
    certifyingBody: "Балкан Биосерт ООД",
    lastInspectionDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const [harvForm, setHarvForm] = useState({
    apiaryId: DEMO_APIARIES[0].id,
    apiaryName: DEMO_APIARIES[0].name,
    date: new Date().toISOString().split("T")[0],
    honeyType: "acacia" as const,
    harvestKg: 500,
    moisturePercent: 17.8,
    batchNumber: `ПАРТ-МЕД-${Date.now().toString().slice(-4)}`,
    labTestStatus: "passed" as const
  });

  const handleSaveApiary = (e: React.FormEvent) => {
    e.preventDefault();
    const newApi: ApiaryRegistry = {
      id: `api-${Date.now()}`,
      ...apiForm
    };
    setApiaries([newApi, ...apiaries]);
    setShowApiForm(false);
  };

  const handleSaveHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    const newHarv: BeeHarvestLog = {
      id: `harv-b-${Date.now()}`,
      ...harvForm,
      accountingAccount: "303"
    };
    setHarvests([newHarv, ...harvests]);
    setShowHarvForm(false);
  };

  const totalHives = apiaries.reduce((s, a) => s + a.hivesCount, 0);
  const totalHoneyKg = harvests.reduce((s, h) => s + h.harvestKg, 0);
  const organicHives = apiaries.filter(a => a.isOrganicCertified).reduce((s, a) => s + a.hivesCount, 0);

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Пчеларство, Био пчелини и Медосбор</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              ВетИС Регистър • Сметка 303 (Мед и Пчелни продукти)
            </span>
          </div>

          <div className="flex flex-wrap rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            <button
              onClick={() => setActiveTab("apiaries")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "apiaries"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Bug size={14} className="text-amber-500" />
              <span>Регистър Пчелини ({apiaries.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("honey_harvest")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "honey_harvest"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Droplets size={14} className="text-amber-600" />
              <span>Добив Пчелен Мед (Сметка 303)</span>
            </button>
            <button
              onClick={() => setActiveTab("vet_varroa")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "vet_varroa"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <ShieldCheck size={14} className={activeTab === "vet_varroa" ? "text-white" : "text-amber-500"} />
              <span>Вет. Дневник & Вароатоза</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {activeTab === "apiaries" && (
          <>
            {/* Banner Hero */}
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/20 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
                  <Bug size={14} />
                  <span>Електронен Регистър на пчелните семейства</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Управление на Пчелини и Биологично производство
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Регистрация съгласно Наредба № 10 на МЗХ за ВетИС обекти. Следене на системи кошери (Дадан-Блат, Лангстрот-Рут, Фарар) и <strong>Биологични сертификати</strong> с акредитиран контрол.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Общ брой пчелни семейства</span>
                <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{totalHives} кошера</p>
                <span className="mt-1 block text-xs font-bold text-slate-500">В {apiaries.length} регистрирани ВетИС пчелина</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Биологично сертифицирани</span>
                <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{organicHives} кошера</p>
                <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Пълно съответствие с Регламент (ЕС) 2018/848</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-amber-500/40 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Добит мед за сезона (Сметка 303)</span>
                <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{totalHoneyKg.toLocaleString("bg-BG")} кг</p>
                <span className="mt-1 block text-xs font-extrabold text-amber-800 dark:text-amber-300">Акациев, Липов и Слънчогледов мед</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowApiForm(!showApiForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-amber-500/25 hover:scale-[1.02] transition"
              >
                <Plus size={16} />
                <span>{showApiForm ? "Скрий формата" : "Регистрирай нов Пчелин (ВетИС)"}</span>
              </button>
            </div>

            {showApiForm && (
              <form onSubmit={handleSaveApiary} className="glass-panel-pro rounded-[32px] border border-amber-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bug size={18} className="text-amber-600" />
                    <span>Регистрация на Пчелин</span>
                  </h3>
                  <button type="button" onClick={() => setShowApiForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">ВетИС Регистрационен №</label>
                    <input value={apiForm.vetIsNumber} onChange={(e) => setApiForm({ ...apiForm, vetIsNumber: e.target.value })} required placeholder="напр. 6140-0192" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Име на пчелина</label>
                    <input value={apiForm.name} onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })} required placeholder="Горски пчелин - Ливадите" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Брой кошери / семейства</label>
                    <input type="number" value={apiForm.hivesCount} onChange={(e) => setApiForm({ ...apiForm, hivesCount: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Адрес / Землище и местоположение</label>
                    <input value={apiForm.locationAddress} onChange={(e) => setApiForm({ ...apiForm, locationAddress: e.target.value })} required placeholder="землище с. Слатина (до акациева гора)" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип кошери</label>
                    <select value={apiForm.hiveType} onChange={(e: any) => setApiForm({ ...apiForm, hiveType: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="dadan_blat">Дадан-Блат (ДБ)</option>
                      <option value="langstroth_ruth">Лангстрот-Рут (Многокорпусни)</option>
                      <option value="farrar">Фарар</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowApiForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-amber-500/20 hover:scale-[1.02] transition">Заведи в регистъра</button>
                </div>
              </form>
            )}

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">ВетИС № & Име</th>
                      <th className="p-4">Землище & Местоположение</th>
                      <th className="p-4 text-right">Кошери</th>
                      <th className="p-4 text-center">Система</th>
                      <th className="p-4 text-center">Био Сертификат</th>
                      <th className="p-4 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {apiaries.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-black text-slate-900 dark:text-white text-xs">
                          {a.name}
                          <span className="block font-mono text-[11px] text-amber-600 dark:text-amber-400">№ {a.vetIsNumber}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{a.locationAddress}</td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white text-sm">{a.hivesCount} бр.</td>
                        <td className="p-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                          {a.hiveType === "dadan_blat" ? "Дадан-Блат" : a.hiveType === "langstroth_ruth" ? "Лангстрот-Рут" : "Фарар"}
                        </td>
                        <td className="p-4 text-center">
                          {a.isOrganicCertified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              ✔ {a.certifyingBody || "Био Сертифициран"}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Конвенционален</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => setApiaries(apiaries.filter(item => item.id !== a.id))} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
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

        {activeTab === "honey_harvest" && (
          <>
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/20 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
                  <Droplets size={14} />
                  <span>Центрофугиране & Завеждане по Сметка 303 Готова Продукция</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Дневник за добив на пчелен мед, прашец и прополис
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Всяка партида мед се регистрира със сертификат от лаборатория (влажност под 20% по стандарт) и се заделя с точна себестойност в склада като <strong>Готова продукция (Сметка 303)</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Добити партиди мед: <strong className="text-slate-900 dark:text-white font-mono text-base">{harvests.length} партиди ({totalHoneyKg} кг)</strong></span>
              <button
                onClick={() => setShowHarvForm(!showHarvForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-amber-500/25 hover:scale-[1.02] transition"
              >
                <Plus size={16} />
                <span>{showHarvForm ? "Скрий формата" : "Въведи нова партида центрофугиран мед"}</span>
              </button>
            </div>

            {showHarvForm && (
              <form onSubmit={handleSaveHarvest} className="glass-panel-pro rounded-[32px] border border-amber-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Droplets size={18} className="text-amber-600" />
                    <span>Завеждане на добив Пчелен Мед (Сметка 303)</span>
                  </h3>
                  <button type="button" onClick={() => setShowHarvForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Пчелин</label>
                    <select value={harvForm.apiaryId} onChange={(e) => {
                      const sel = apiaries.find(item => item.id === e.target.value) || apiaries[0];
                      setHarvForm({ ...harvForm, apiaryId: sel.id, apiaryName: sel.name });
                    }} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500">
                      {apiaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дата на добив</label>
                    <input type="date" value={harvForm.date} onChange={(e) => setHarvForm({ ...harvForm, date: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Вид мед</label>
                    <select value={harvForm.honeyType} onChange={(e: any) => setHarvForm({ ...harvForm, honeyType: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="acacia">Акациев мед</option>
                      <option value="linden">Липов мед</option>
                      <option value="polyfloral">Полифлорен / Букет</option>
                      <option value="honeydew">Манов мед (Горски)</option>
                      <option value="sunflower">Слънчогледов мед</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Добито количество (кг)</label>
                    <input type="number" step="1" value={harvForm.harvestKg} onChange={(e) => setHarvForm({ ...harvForm, harvestKg: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Влажност по рефрактометър (%)</label>
                    <input type="number" step="0.1" value={harvForm.moisturePercent} onChange={(e) => setHarvForm({ ...harvForm, moisturePercent: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Партиден номер</label>
                    <input value={harvForm.batchNumber} onChange={(e) => setHarvForm({ ...harvForm, batchNumber: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowHarvForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-amber-500/20 hover:scale-[1.02] transition">Заведи по Сметка 303 Готова продукция</button>
                </div>
              </form>
            )}

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Партида №</th>
                      <th className="p-4">Пчелин & Дата</th>
                      <th className="p-4">Вид мед</th>
                      <th className="p-4 text-right">Количество (кг)</th>
                      <th className="p-4 text-right">Влажност (%)</th>
                      <th className="p-4 text-center">Счетоводно</th>
                      <th className="p-4 text-center">Лаборатория</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {harvests.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-extrabold text-slate-900 dark:text-white text-xs">{h.batchNumber}</td>
                        <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-400">{h.apiaryName}<br /><span className="font-mono font-normal text-slate-400">{new Date(h.date).toLocaleDateString("bg-BG")}</span></td>
                        <td className="p-4 font-black text-amber-600 dark:text-amber-400 text-xs">
                          {h.honeyType === "acacia" ? "Акациев мед" : h.honeyType === "linden" ? "Липов мед" : h.honeyType === "polyfloral" ? "Полифлорен букет" : h.honeyType === "honeydew" ? "Манов горски мед" : "Слънчогледов мед"}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white text-base font-mono">{h.harvestKg} кг</td>
                        <td className="p-4 text-right font-mono text-xs">
                          <span className={h.moisturePercent <= 18.5 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>{h.moisturePercent}%</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="rounded-xl px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold font-mono">
                            С/ка 303 Готова продукция
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600">
                            ✔ Сертификат ОК
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

        {activeTab === "vet_varroa" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
                  <ShieldCheck size={14} />
                  <span>БАБХ Ветеринарно-зоотехнически дневник</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Контрол срещу Вароатоза, Нозематоза и Зимно подхранване
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  За да запазят своя <strong>Биологичен статус</strong>, пчеларите трябва да третират кошерите само с разрешени органични субстанции (Оксалова киселина, Мравчена киселина, Тимол) и да вписват всяка ревизия.
                </p>
              </div>
            </div>

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Пчелин</th>
                      <th className="p-4">Дата на третиране</th>
                      <th className="p-4">Вид интервенция</th>
                      <th className="p-4">Използван препарат</th>
                      <th className="p-4 text-center">Био съвместимост</th>
                      <th className="p-4 text-right">Третирани кошери</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {vetLogs.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-black text-slate-900 dark:text-white text-xs">{v.apiaryName}</td>
                        <td className="p-4 font-mono text-xs text-slate-500">{new Date(v.date).toLocaleDateString("bg-BG")}</td>
                        <td className="p-4 font-extrabold text-rose-600 dark:text-rose-400 text-xs">
                          {v.treatmentType === "varroa_spring" ? "Пролетно третиране (Вароатоза)" : v.treatmentType === "varroa_autumn" ? "Есенно третиране (Вароатоза)" : v.treatmentType === "nosema" ? "Профилактика Нозематоза" : "Подхранване (Инвертен сироп)"}
                        </td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{v.medicationOrSubstance}</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                            ✔ Разрешено за БИО
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white text-sm">{v.hivesTreatedCount} кошера</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
