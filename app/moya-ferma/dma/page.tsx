"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Package, Plus, Calculator, Trash2, Loader2, X, Sprout, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FixedAsset = {
  id: string; 
  inventoryNumber: string; 
  name: string; 
  category: string;
  acquisitionDate: string; 
  acquisitionCost: number; 
  salvageValue: number;
  usefulLifeMonths: number; 
  amortizationMethod: string;
  accumulatedAmortization: number; 
  bookValue: number;
  location: string; 
  notes: string; 
  isActive: string;
  writtenOffAt: string | null;
};

type ScheduleEntry = { month: number; date: string; amount: number; bookValue: number };

const CATEGORIES = [
  "Земеделска земя (0% амортизация - Сметка 201)",
  "Енергетични машини - Трактори и комбайни (20% - Кат. II ЗКПО)",
  "Прикачен инвентар - Сеялки, плугове и брани (10% - Кат. III ЗКПО)",
  "Земеделски сгради, навеси и силози (4% - Кат. I ЗКПО)",
  "Транспортни средства - Камиони и пикапи (10% - Кат. III ЗКПО)",
  "Биологични активи - Трайни насаждения (Сметка 272)",
  "Други ДМА"
];

const DEMO_ASSETS: FixedAsset[] = [
  {
    id: "demo-1",
    inventoryNumber: "ДМА-2023-001",
    name: "Трактор John Deere 8R 340",
    category: "Енергетични машини - Трактори и комбайни (20% - Кат. II ЗКПО)",
    acquisitionDate: "2023-04-10",
    acquisitionCost: 380000,
    salvageValue: 38000,
    usefulLifeMonths: 60,
    amortizationMethod: "linear",
    accumulatedAmortization: 142500,
    bookValue: 237500,
    location: "База Слатина - Гараж 1",
    notes: "Закупен по мярка 4.1 ПРСР",
    isActive: "true",
    writtenOffAt: null,
  },
  {
    id: "demo-2",
    inventoryNumber: "ДМА-2024-012",
    name: "Прикачна сеялка Vaderstad Rapid 600S",
    category: "Прикачен инвентар - Сеялки, плугове и брани (10% - Кат. III ЗКПО)",
    acquisitionDate: "2024-02-15",
    acquisitionCost: 110000,
    salvageValue: 10000,
    usefulLifeMonths: 120,
    amortizationMethod: "linear",
    accumulatedAmortization: 16666.66,
    bookValue: 93333.34,
    location: "База Слатина - Навес инвентар",
    notes: "Собствени средства",
    isActive: "true",
    writtenOffAt: null,
  },
  {
    id: "demo-3",
    inventoryNumber: "ЗЕМЯ-004",
    name: "Земеделска земя - Нива 420 дка м. Равнището",
    category: "Земеделска земя (0% амортизация - Сметка 201)",
    acquisitionDate: "2021-11-20",
    acquisitionCost: 588000,
    salvageValue: 588000,
    usefulLifeMonths: 999,
    amortizationMethod: "none",
    accumulatedAmortization: 0,
    bookValue: 588000,
    location: "Землище с. Слатина, КЖР 67341.12.44",
    notes: "Не се амортизира по ЗКПО и МСС 16",
    isActive: "true",
    writtenOffAt: null,
  },
  {
    id: "demo-4",
    inventoryNumber: "СГР-2022-002",
    name: "Метален силоз за зърно 2500 тона с аерация",
    category: "Земеделски сгради, навеси и силози (4% - Кат. I ЗКПО)",
    acquisitionDate: "2022-08-01",
    acquisitionCost: 240000,
    salvageValue: 20000,
    usefulLifeMonths: 300,
    amortizationMethod: "linear",
    accumulatedAmortization: 27866.66,
    bookValue: 212133.34,
    location: "База Слатина - Силозно стопанство",
    notes: "Категория I - 4% годишна данъчна норма",
    isActive: "true",
    writtenOffAt: null,
  }
];

export default function DmaPage() {
  const [assets, setAssets] = useState<FixedAsset[]>(DEMO_ASSETS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [form, setForm] = useState({
    inventoryNumber: "", 
    name: "", 
    category: CATEGORIES[1], 
    acquisitionDate: new Date().toISOString().split("T")[0],
    acquisitionCost: 0, 
    salvageValue: 0, 
    usefulLifeMonths: 60,
    location: "", 
    notes: "",
  });
  const [scheduleAsset, setScheduleAsset] = useState<FixedAsset | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { 
      const r = await fetch("/api/farm/fixed-assets"); 
      if (r.ok) {
        const d = await r.json(); 
        if (Array.isArray(d) && d.length > 0) {
          setAssets(d);
        }
      }
    } catch {
      // Keep demo data on API failure or offline
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/fixed-assets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await load();
      setShowForm(false);
      setForm({ inventoryNumber: "", name: "", category: CATEGORIES[1], acquisitionDate: "", acquisitionCost: 0, salvageValue: 0, usefulLifeMonths: 60, location: "", notes: "" });
    } finally { setSaving(false); }
  };

  const handleAmortize = async () => {
    setCalcLoading(true);
    try {
      await fetch("/api/farm/fixed-assets/amortize", { method: "POST" });
      await load();
    } finally { setCalcLoading(false); }
  };

  const handleWriteOff = async (id: string) => {
    try {
      await fetch(`/api/farm/fixed-assets/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: 'false', writtenOffAt: new Date().toISOString() }),
      });
      setAssets((prev) => prev.map((a) => a.id === id ? { ...a, isActive: "false" } : a));
    } catch {
      setAssets((prev) => prev.map((a) => a.id === id ? { ...a, isActive: "false" } : a));
    }
  };

  const openSchedule = async (asset: FixedAsset) => {
    setScheduleAsset(asset);
    setScheduleLoading(true);
    try {
      const { generateAmortizationSchedule } = await import("@/lib/fixed-assets/amortization");
      const sched = generateAmortizationSchedule({
        acquisitionCost: asset.acquisitionCost,
        salvageValue: asset.salvageValue,
        usefulLifeMonths: asset.category.includes("Земеделска земя") ? 999 : asset.usefulLifeMonths,
        acquisitionDate: asset.acquisitionDate,
      });
      setSchedule(sched);
    } finally { setScheduleLoading(false); }
  };

  const totalAcquisition = assets.filter(a => a.isActive === "true").reduce((s, a) => s + Number(a.acquisitionCost), 0);
  const totalAmortized = assets.filter(a => a.isActive === "true").reduce((s, a) => s + Number(a.accumulatedAmortization), 0);
  const totalBookValue = assets.filter(a => a.isActive === "true").reduce((s, a) => s + Number(a.bookValue), 0);
  const totalLandValue = assets.filter(a => a.isActive === "true" && a.category.includes("Земеделска земя")).reduce((s, a) => s + Number(a.acquisitionCost), 0);

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">ДМА — Дълготрайни материални активи & Земя</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              ЗКПО & НСС 16/41
            </span>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={handleAmortize} 
              disabled={calcLoading}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4.5 py-2.5 text-xs font-black text-white shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
            >
              {calcLoading ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
              <span>Изчисли амортизации за месеца</span>
            </button>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4.5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <Plus size={15} /> 
              <span>{showForm ? "Скрий формата" : "Добави ДМА / Земя"}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Banner Hero */}
        <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
              <Package size={14} />
              <span>Земеделски инвентарен регистър по ЗКПО</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Дълготрайни материални активи, Техника и Земеделска Земя
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Автоматизирано разделяне на активите по данъчни категории: Енергетични машини (Кат. II - 20%), Прикачен инвентар (Кат. III - 10%), Силози и сгради (Кат. I - 4%), както и Земеделска земя (Сметка 201), която по закон не подлежи на амортизация.
            </p>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Първоначална стойност (ДМА)</span>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {totalAcquisition.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв
            </p>
            <span className="mt-1 block text-xs font-bold text-slate-500">Всички активни инвентарни единици</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Натрупана амортизация</span>
            <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {totalAmortized.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв
            </p>
            <span className="mt-1 block text-xs font-bold text-slate-500">Признат счетоводен и данъчен разход</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Балансова (Остатъчна) стойност</span>
            <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {totalBookValue.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв
            </p>
            <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Нетна стойност в Баланса</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-5 border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-50/80 to-white dark:from-fuchsia-950/30 dark:to-slate-900/95 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">Земеделска земя (Сметка 201)</span>
            <p className="mt-2 text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">
              {totalLandValue.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв
            </p>
            <span className="mt-1 block text-xs font-extrabold text-fuchsia-800 dark:text-fuchsia-300">0% амортизация (Неовехтяващ актив)</span>
          </div>
        </div>

        {/* Add Asset Form */}
        {showForm && (
          <div className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-emerald-600 dark:text-emerald-400" />
                <span>Завеждане на нов ДМА или Земеделска Земя</span>
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Инв. номер</label>
                <input 
                  value={form.inventoryNumber} 
                  onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })} 
                  required
                  placeholder="напр. ДМА-2025-004 или ЗЕМЯ-012"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Име на актива / Парцела</label>
                <input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required
                  placeholder="напр. Трактор Claas Axion 870"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Категория по ЗКПО</label>
                <select 
                  value={form.category} 
                  onChange={(e) => {
                    const val = e.target.value;
                    let months = 60;
                    if (val.includes("Земеделска земя")) months = 999;
                    else if (val.includes("Прикачен инвентар")) months = 120;
                    else if (val.includes("сгради")) months = 300;
                    setForm({ ...form, category: val, usefulLifeMonths: months });
                  }}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дата на придобиване / въвеждане</label>
                <input 
                  type="date" 
                  value={form.acquisitionDate} 
                  onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} 
                  required
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Цена на придобиване (лв)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={form.acquisitionCost || ""} 
                  onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })} 
                  required
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Остатъчна (ликвидационна) стойност</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={form.salvageValue || ""} 
                  onChange={(e) => setForm({ ...form, salvageValue: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Амортизационен срок (мес.) {form.category.includes("Земеделска земя") && "— Не се амортизира"}
                </label>
                <input 
                  type="number" 
                  disabled={form.category.includes("Земеделска земя")}
                  value={form.usefulLifeMonths || ""} 
                  onChange={(e) => setForm({ ...form, usefulLifeMonths: Number(e.target.value) })} 
                  required
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Локация / Гараж / Землище</label>
                <input 
                  value={form.location} 
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="напр. База Слатина или КЖР 123"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Бележки / Договор / ПРСР</label>
                <input 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="напр. Мярка 4.1 или Фактура №..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="sm:col-span-3 flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400">
                  Отказ
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-50 transition">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Заведи в регистъра</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Table */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
          <div className="border-b border-slate-200/80 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package size={20} className="text-teal-600 dark:text-teal-400" />
                <span>Инвентарен опис и Амортизационен статус</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Кликнете върху името на актива, за да видите пълен погасителен / амортизационен план по месеци</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 size={28} className="animate-spin text-emerald-600" /></div>
          ) : assets.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500"><Package size={48} className="mx-auto mb-3 text-slate-300" /><p className="font-bold">Няма въведени активи.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Инв. №</th>
                    <th className="p-4">Име на актив / Парцел</th>
                    <th className="p-4">Категория (ЗКПО / МСС)</th>
                    <th className="p-4">Дата на придобиване</th>
                    <th className="p-4 text-right">Стойност (лв)</th>
                    <th className="p-4 text-right">Аморт. срок</th>
                    <th className="p-4 text-right">Натрупана аморт.</th>
                    <th className="p-4 text-right">Балансова стойност</th>
                    <th className="p-4 text-center">Статус</th>
                    <th className="p-4 text-center">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {assets.map((a) => {
                    const isLand = a.category.includes("Земеделска земя");
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-xs font-extrabold text-slate-900 dark:text-white">{a.inventoryNumber}</td>
                        <td className="p-4">
                          <button onClick={() => openSchedule(a)} className="text-left font-extrabold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition flex items-center gap-1.5">
                            <span>{a.name}</span>
                            <ArrowRight size={13} className="opacity-70" />
                          </button>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span className={cn(
                            "inline-block rounded-xl px-2.5 py-1 text-[11px] font-extrabold",
                            isLand ? "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}>
                            {a.category}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{new Date(a.acquisitionDate).toLocaleDateString("bg-BG")}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">{Number(a.acquisitionCost).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</td>
                        <td className="p-4 text-right font-bold text-slate-600 dark:text-slate-400">
                          {isLand ? <span className="text-fuchsia-600 font-black">0 мес. (Земя)</span> : `${a.usefulLifeMonths} мес.`}
                        </td>
                        <td className="p-4 text-right font-extrabold text-amber-600 dark:text-amber-400">
                          {isLand ? "0.00 лв" : `${Number(a.accumulatedAmortization).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв`}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">{Number(a.bookValue).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${a.isActive === 'true' ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 dark:text-emerald-300' : 'bg-red-500/15 text-red-800 border border-red-500/30 dark:text-red-300'}`}>
                            {a.isActive === 'true' ? '● Активен' : '○ Отписан'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {a.isActive === 'true' && (
                            <button onClick={() => handleWriteOff(a.id)} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition" title="Отпиши от баланса">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Amortization Schedule Modal */}
      {scheduleAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="flex items-center gap-2.5 text-xl font-black text-slate-900 dark:text-white">
                  <Calculator className="text-amber-600" size={24} /> 
                  <span>Амортизационен план — {scheduleAsset.name}</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Инв. № {scheduleAsset.inventoryNumber} • {scheduleAsset.category}</p>
              </div>
              <button onClick={() => setScheduleAsset(null)} className="rounded-full p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition">
                <X size={18} />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-xs font-black uppercase text-slate-400">Първоначална цена</span>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{Number(scheduleAsset.acquisitionCost).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-xs font-black uppercase text-slate-400">Месечна амортизация</span>
                <p className="mt-1 text-lg font-black text-amber-600 dark:text-amber-400">
                  {scheduleAsset.category.includes("Земеделска земя") ? "0.00 лв (Земя)" : `${schedule.length > 0 ? schedule[0].amount.toFixed(2) : "0.00"} лв`}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-xs font-black uppercase text-slate-400">Амортизационен срок</span>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {scheduleAsset.category.includes("Земеделска земя") ? "Неограничен" : `${scheduleAsset.usefulLifeMonths} мес.`}
                </p>
              </div>
            </div>

            {scheduleAsset.category.includes("Земеделска земя") ? (
              <div className="rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 p-6 text-center space-y-2">
                <Sprout size={36} className="mx-auto text-fuchsia-600 dark:text-fuchsia-400" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">Земеделската земя не се амортизира</h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Съгласно чл. 50 от ЗКПО и МСС 16, земята е актив с неограничен полезен живот и запазва своята балансова стойност от {Number(scheduleAsset.acquisitionCost).toLocaleString("bg-BG")} лв без промяна.
                </p>
              </div>
            ) : scheduleLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-emerald-600" /></div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/80 sticky top-0">
                    <tr>
                      <th className="p-3.5">Месец</th>
                      <th className="p-3.5">Дата на начисляване</th>
                      <th className="p-3.5 text-right">Месечна квота (лв)</th>
                      <th className="p-3.5 text-right">Остатъчна балансова стойност</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {schedule.map((entry) => (
                      <tr key={entry.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">№ {entry.month}</td>
                        <td className="p-3.5 text-slate-500 font-mono text-xs">{new Date(entry.date).toLocaleDateString("bg-BG")}</td>
                        <td className="p-3.5 text-right font-extrabold text-amber-600 dark:text-amber-400">{entry.amount.toFixed(2)} лв</td>
                        <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">{entry.bookValue.toFixed(2)} лв</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
