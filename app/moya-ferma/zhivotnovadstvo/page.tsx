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
  ShieldCheck, 
  Sparkles, 
  HeartPulse, 
  Scale, 
  Milk, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnimalGroup = {
  id: string;
  tagNumber: string;
  name: string;
  species: "cattle" | "sheep" | "goats" | "pigs" | "poultry";
  category: string;
  birthDate: string;
  gender: "female" | "male";
  status: "active" | "pregnant" | "sick" | "sold" | "deceased";
  weightKg: number;
  dailyYieldLiters?: number;
  location: string;
  vetNotes?: string;
};

type VetLogEntry = {
  id: string;
  animalTag: string;
  date: string;
  procedureType: "vaccination" | "deworming" | "treatment" | "checkup" | "calving";
  medicationName: string;
  dose: string;
  vetDoctorName: string;
  withdrawalPeriodDays: number;
  withdrawalEndDate: string;
  isCompleted: boolean;
};

const DEMO_ANIMALS: AnimalGroup[] = [
  {
    id: "an-1",
    tagNumber: "BG 24091 0012",
    name: "Крава Сияна (Холщайн-Фризийска)",
    species: "cattle",
    category: "Млечна крава - I лактация",
    birthDate: "2021-04-12",
    gender: "female",
    status: "active",
    weightKg: 620,
    dailyYieldLiters: 32.5,
    location: "Обосрен корпус №1 - Бокс А",
    vetNotes: "Отлично клинично състояние"
  },
  {
    id: "an-2",
    tagNumber: "BG 24091 0045",
    name: "Крава Бела (Черношарено говедо)",
    species: "cattle",
    category: "Млечна крава - II лактация",
    birthDate: "2020-09-18",
    gender: "female",
    status: "pregnant",
    weightKg: 680,
    dailyYieldLiters: 28.0,
    location: "Обосрен корпус №1 - Родилно отделение",
    vetNotes: "Завеждане на сухостоен период от 01.08.2025"
  },
  {
    id: "an-3",
    tagNumber: "BG 18023 1104",
    name: "Бик Херкулес (Месодаен Абердин Ангус)",
    species: "cattle",
    category: "Разплоден бик",
    birthDate: "2022-02-10",
    gender: "male",
    status: "active",
    weightKg: 940,
    location: "Пасищен комплекс Бреста - Бокс 3",
    vetNotes: "Редовно обезпаразитен по график БАБХ"
  },
  {
    id: "an-4",
    tagNumber: "BG 31004 8812 (Група 120 бр.)",
    name: "Стадо Овце-майки (Синтетична попул. Българска Млечна)",
    species: "sheep",
    category: "Овце-майки под селекционен контрол",
    birthDate: "2022-05-01",
    gender: "female",
    status: "active",
    weightKg: 65,
    dailyYieldLiters: 1.8,
    location: "Овцеферма Слатина - Сектор Б",
    vetNotes: "Ваксинирани срещу син език - Сертификат БАБХ"
  }
];

const DEMO_VET_LOGS: VetLogEntry[] = [
  {
    id: "vet-1",
    animalTag: "BG 24091 0012 (Крава Сияна)",
    date: "2025-07-02",
    procedureType: "vaccination",
    medicationName: "Ваксина Bovi-Shield GOLD FP 5",
    dose: "2 ml подкожно",
    vetDoctorName: "д-р Стефан Вълчев (Рег. № ВетИС 4120)",
    withdrawalPeriodDays: 0,
    withdrawalEndDate: "2025-07-02",
    isCompleted: true
  },
  {
    id: "vet-2",
    animalTag: "BG 24091 0089 (Теле Борко)",
    date: "2025-07-10",
    procedureType: "treatment",
    medicationName: "Антибиотик Пенстреп (Penstrep 400)",
    dose: "15 ml интрамускулно (3 дни)",
    vetDoctorName: "д-р Стефан Вълчев",
    withdrawalPeriodDays: 14,
    withdrawalEndDate: "2025-07-24",
    isCompleted: false
  }
];

export default function ZhivotnovadstvoPage() {
  const [activeTab, setActiveTab] = useState<"herd" | "vet_log" | "ration_calc">("herd");
  const [animals, setAnimals] = useState<AnimalGroup[]>(DEMO_ANIMALS);
  const [vetLogs, setVetLogs] = useState<VetLogEntry[]>(DEMO_VET_LOGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showVetForm, setShowVetForm] = useState(false);
  const [search, setSearch] = useState("");

  // Animal form
  const [form, setForm] = useState({
    tagNumber: "",
    name: "",
    species: "cattle" as const,
    category: "Млечна крава",
    birthDate: new Date().toISOString().split("T")[0],
    gender: "female" as const,
    status: "active" as const,
    weightKg: 550,
    dailyYieldLiters: 25,
    location: "Обосрен корпус №1",
    vetNotes: ""
  });

  // Vet log form
  const [vetForm, setVetForm] = useState({
    animalTag: DEMO_ANIMALS[0].tagNumber,
    date: new Date().toISOString().split("T")[0],
    procedureType: "treatment" as const,
    medicationName: "",
    dose: "10 ml",
    vetDoctorName: "д-р Стефан Вълчев",
    withdrawalPeriodDays: 7
  });

  // Ration calculator state
  const [rationAnimalsCount, setRationAnimalsCount] = useState(45);
  const [rationSilageKg, setRationSilageKg] = useState(25);
  const [rationAlfalfaKg, setRationAlfalfaKg] = useState(6);
  const [rationConcentrateKg, setRationConcentrateKg] = useState(7.5);
  const [silagePricePerTon, setSilagePricePerTon] = useState(120);
  const [alfalfaPricePerTon, setAlfalfaPricePerTon] = useState(320);
  const [concentratePricePerTon, setConcentratePricePerTon] = useState(650);

  const handleSaveAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newAnimal: AnimalGroup = {
        id: `an-${Date.now()}`,
        ...form
      };
      setAnimals([newAnimal, ...animals]);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleSaveVet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endDate = new Date(new Date(vetForm.date).getTime() + vetForm.withdrawalPeriodDays * 86400000).toISOString().split("T")[0];
      const newLog: VetLogEntry = {
        id: `vet-${Date.now()}`,
        animalTag: vetForm.animalTag,
        date: vetForm.date,
        procedureType: vetForm.procedureType,
        medicationName: vetForm.medicationName,
        dose: vetForm.dose,
        vetDoctorName: vetForm.vetDoctorName,
        withdrawalPeriodDays: vetForm.withdrawalPeriodDays,
        withdrawalEndDate: endDate,
        isCompleted: vetForm.withdrawalPeriodDays === 0
      };
      setVetLogs([newLog, ...vetLogs]);
      setShowVetForm(false);
    } finally { setSaving(false); }
  };

  const handleDeleteAnimal = (id: string) => {
    if (confirm("Сигурни ли сте, че искате да отпишете това животно от стадото?")) {
      setAnimals(animals.filter(a => a.id !== id));
    }
  };

  const filteredAnimals = animals.filter(a => 
    a.tagNumber.toLowerCase().includes(search.toLowerCase()) || 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalDailyMilk = animals.reduce((sum, a) => sum + (a.dailyYieldLiters || 0), 0);
  const totalWeight = animals.reduce((sum, a) => sum + a.weightKg, 0);
  const activeQuarantineCount = vetLogs.filter(l => !l.isCompleted && new Date(l.withdrawalEndDate) > new Date()).length;

  // Ration math
  const dailyCostPerAnimal = (rationSilageKg * silagePricePerTon + rationAlfalfaKg * alfalfaPricePerTon + rationConcentrateKg * concentratePricePerTon) / 1000;
  const totalDailyHerdCost = dailyCostPerAnimal * rationAnimalsCount;
  const totalMonthlyHerdCost = totalDailyHerdCost * 30;

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Електронен Регистър на Животновъдното стопанство</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              ВетИС & БАБХ Съвместимост • Сметки 301 / 303
            </span>
          </div>

          <div className="flex flex-wrap rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            <button
              onClick={() => setActiveTab("herd")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "herd"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <span>Регистър Стадо ({animals.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("vet_log")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "vet_log"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <HeartPulse size={14} className="text-rose-500" />
              <span>Ветеринарен Дневник (БАБХ)</span>
              {activeQuarantineCount > 0 && (
                <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px]">{activeQuarantineCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("ration_calc")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "ration_calc"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Scale size={14} className={activeTab === "ration_calc" ? "text-white" : "text-amber-500"} />
              <span>Фуражен баланс и Дажби</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {activeTab === "herd" && (
          <>
            {/* Banner Hero */}
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <ShieldCheck size={14} />
                  <span>Електронна идентификация (Ушни марки & ВетИС)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Управление на Говедовъдство, Овцевъдство и Животновъдни ферми
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Пълен контрол над стадото, родословие, лактационни карти, дневен надой мляко и прираст на живо тегло. Автоматична връзка със субсидиите по обвързана подкрепа (СЕУ/ДФЗ) и ветеринарния надзор.
                </p>
              </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Общ брой глави в стадото</span>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{animals.length} животни / групи</p>
                <span className="mt-1 block text-xs font-bold text-slate-500">Регистрирани с ушни марки ВетИС</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Дневен надой мляко</span>
                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalDailyMilk.toFixed(1)} литра / ден</p>
                <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Готова продукция (Сметка 303)</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">Общо живо тегло</span>
                <p className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400">{totalWeight.toLocaleString("bg-BG")} кг</p>
                <span className="mt-1 block text-xs font-bold text-slate-500">Обобщена биомаса в стопанството</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-rose-500/40 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Карентен период (Вет. карантина)</span>
                <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">{activeQuarantineCount} животни</p>
                <span className="mt-1 block text-xs font-extrabold text-rose-800 dark:text-rose-300">Забранена реализация на мляко/месо</span>
              </div>
            </div>

            {/* Actions and search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Търсене по ушна марка BG..., име или порода..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] transition"
              >
                <Plus size={16} />
                <span>{showForm ? "Скрий формата" : "Заведи ново животно / Група в стадото"}</span>
              </button>
            </div>

            {/* Animal Form */}
            {showForm && (
              <form onSubmit={handleSaveAnimal} className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus size={18} className="text-emerald-600" />
                    <span>Електронна регистрация на животно или група</span>
                  </h3>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Ушна марка / Чип № (ВетИС)</label>
                    <input value={form.tagNumber} onChange={(e) => setForm({ ...form, tagNumber: e.target.value })} required placeholder="BG 24091 0123" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Име / Порода / Описание</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="напр. Крава Мая (Холщайн)" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Вид животно</label>
                    <select value={form.species} onChange={(e: any) => setForm({ ...form, species: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="cattle">Говеда (Крави, Телета, Бици)</option>
                      <option value="sheep">Овце (Майки, Кочове, Агнета)</option>
                      <option value="goats">Кози (Майки, Ярета)</option>
                      <option value="pigs">Свине</option>
                      <option value="poultry">Птици / Кокошки носачки</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Категория / Лактация</label>
                    <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Млечна крава - I лактация" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дата на раждане / Придобиване</label>
                    <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Пол</label>
                    <select value={form.gender} onChange={(e: any) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="female">Женски (Крава / Овца)</option>
                      <option value="male">Мъжки (Бик / Коч)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Живо тегло (кг)</label>
                    <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дневен надой (литра)</label>
                    <input type="number" step="0.1" value={form.dailyYieldLiters} onChange={(e) => setForm({ ...form, dailyYieldLiters: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Локация / Обор / Бокс</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="напр. Обор №1 - Бокс А" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition">Заведи в стадото</button>
                </div>
              </form>
            )}

            {/* Herd Table */}
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Ушна марка (ВетИС)</th>
                      <th className="p-4">Име / Порода</th>
                      <th className="p-4">Категория & Пол</th>
                      <th className="p-4 text-right">Тегло (кг)</th>
                      <th className="p-4 text-right">Надой (л/ден)</th>
                      <th className="p-4">Локация</th>
                      <th className="p-4 text-center">Статус</th>
                      <th className="p-4 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {filteredAnimals.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-xs font-extrabold text-slate-900 dark:text-white">{a.tagNumber}</td>
                        <td className="p-4 font-black text-slate-900 dark:text-white">{a.name}</td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{a.category}</span>
                          <span className="text-[11px] text-slate-400">{a.gender === 'female' ? 'Женско' : 'Мъжко'} • Род. {new Date(a.birthDate).toLocaleDateString("bg-BG")}</span>
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white">{a.weightKg} кг</td>
                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {a.dailyYieldLiters ? `${a.dailyYieldLiters.toFixed(1)} л` : "—"}
                        </td>
                        <td className="p-4 text-xs text-slate-500">{a.location}</td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold",
                            a.status === 'active' ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30" :
                            a.status === 'pregnant' ? "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-500/30" :
                            "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          )}>
                            {a.status === 'active' ? '● Активно' : a.status === 'pregnant' ? '♥ Бременна' : '○ В лечение'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteAnimal(a.id)} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
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

        {activeTab === "vet_log" && (
          <>
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
                  <HeartPulse size={14} />
                  <span>БАБХ Ветеринарно-медицински дневник • Карентни срокове</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Протокол за проведени лечения, ваксинации и карентна карантина
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  По закон всяко приложено лекарство (антибиотици, ваксини, обезпаразитяване) се вписва в дневника с точен <strong>карентен срок</strong>, през който млякото или месото <strong>не бива да се предава в мандрата или кланицата</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Записани интервенции: <strong className="text-slate-900 dark:text-white font-mono">{vetLogs.length} бр.</strong></span>
              <button
                onClick={() => setShowVetForm(!showVetForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-rose-500/25 hover:scale-[1.02] transition"
              >
                <Plus size={16} />
                <span>{showVetForm ? "Скрий формата" : "Запиши ветеринарна процедура (БАБХ)"}</span>
              </button>
            </div>

            {showVetForm && (
              <form onSubmit={handleSaveVet} className="glass-panel-pro rounded-[32px] border border-rose-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartPulse size={18} className="text-rose-600" />
                    <span>Вписване във ветеринарения дневник</span>
                  </h3>
                  <button type="button" onClick={() => setShowVetForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Животно / Ушна марка</label>
                    <select value={vetForm.animalTag} onChange={(e) => setVetForm({ ...vetForm, animalTag: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500">
                      {animals.map(a => <option key={a.id} value={`${a.tagNumber} (${a.name})`}>{a.tagNumber} — {a.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дата на интервенцията</label>
                    <input type="date" value={vetForm.date} onChange={(e) => setVetForm({ ...vetForm, date: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип процедура</label>
                    <select value={vetForm.procedureType} onChange={(e: any) => setVetForm({ ...vetForm, procedureType: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500">
                      <option value="vaccination">Ваксинация</option>
                      <option value="deworming">Обезпаразитяване</option>
                      <option value="treatment">Лечение (Антибиотик / Инжекции)</option>
                      <option value="checkup">Профилактичен преглед</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Вет. препарат / Лекарство и дозировка</label>
                    <input value={vetForm.medicationName} onChange={(e) => setVetForm({ ...vetForm, medicationName: e.target.value })} required placeholder="напр. Пенстреп 400 (15 ml интрамускулно)" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Карентен срок (дни карантина)</label>
                    <input type="number" value={vetForm.withdrawalPeriodDays} onChange={(e) => setVetForm({ ...vetForm, withdrawalPeriodDays: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Лекуващ ветеринарен лекар (Име и Рег. № ВетИС)</label>
                    <input value={vetForm.vetDoctorName} onChange={(e) => setVetForm({ ...vetForm, vetDoctorName: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowVetForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-rose-500/20 hover:scale-[1.02] transition">Запиши в дневника</button>
                </div>
              </form>
            )}

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Животно / Ушна марка</th>
                      <th className="p-4">Дата</th>
                      <th className="p-4">Препарат & Доза</th>
                      <th className="p-4">Лекуващ лекар</th>
                      <th className="p-4 text-center">Карентен срок (Забрана)</th>
                      <th className="p-4 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {vetLogs.map((l) => {
                      const isActiveQuarantine = !l.isCompleted && new Date(l.withdrawalEndDate) > new Date();
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-black text-slate-900 dark:text-white text-xs">{l.animalTag}</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{new Date(l.date).toLocaleDateString("bg-BG")}</td>
                          <td className="p-4">
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 block text-xs">{l.medicationName}</span>
                            <span className="text-[11px] text-slate-400">{l.dose}</span>
                          </td>
                          <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{l.vetDoctorName}</td>
                          <td className="p-4 text-center">
                            {l.withdrawalPeriodDays > 0 ? (
                              <span className={cn("rounded-xl px-2.5 py-1 text-xs font-black border block", isActiveQuarantine ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200")}>
                                {l.withdrawalPeriodDays} дни (до {new Date(l.withdrawalEndDate).toLocaleDateString("bg-BG")})
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Няма карентен срок</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {isActiveQuarantine ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-[11px] font-black uppercase shadow-sm animate-pulse">
                                <AlertTriangle size={12} /> Карантина!
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold dark:text-emerald-300">
                                <CheckCircle2 size={12} /> Свободно
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "ration_calc" && (
          /* TAB 3: Forage Ration & Daily Smetka 301 accounting */
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/20 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
                  <Scale size={14} />
                  <span>Фуражен баланс • Изписване от Сметка 301 в Себестойност</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Калкулатор за дневни дажби и себестойност на храненето
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Изчислете точния дневен и месечен разход за изписване на силаж, люцерна и концентриран фураж от складовите запаси (Сметка 301) директно към аналитичната себестойност на произведеното мляко и прираст.
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 items-start">
              <div className="lg:col-span-2 glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="text-amber-600" size={20} />
                  <span>Параметри на дневната дажба за 1 животно</span>
                </h3>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Брой изхранвани животни в групата</label>
                    <input type="number" value={rationAnimalsCount} onChange={(e) => setRationAnimalsCount(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-base font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Царевичен силаж (кг/ден)</label>
                    <input type="number" step="0.5" value={rationSilageKg} onChange={(e) => setRationSilageKg(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                    <span className="text-[11px] text-slate-400 block">Цена: {silagePricePerTon} лв/тон</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Люцерново сено (кг/ден)</label>
                    <input type="number" step="0.5" value={rationAlfalfaKg} onChange={(e) => setRationAlfalfaKg(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                    <span className="text-[11px] text-slate-400 block">Цена: {alfalfaPricePerTon} лв/тон</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Концентриран фураж (кг/ден)</label>
                    <input type="number" step="0.5" value={rationConcentrateKg} onChange={(e) => setRationConcentrateKg(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                    <span className="text-[11px] text-slate-400 block">Цена: {concentratePricePerTon} лв/тон</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">Автоматично изписване в счетоводния модул</span>
                  <button onClick={() => alert("Успешно изписване на дневната дажба от Сметка 301 Фуражи!")} className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-amber-500/25 hover:scale-[1.02] transition">
                    Изпиши от Сметка 301 (Фуражи)
                  </button>
                </div>
              </div>

              {/* Results Breakdown */}
              <div className="glass-panel-pro rounded-[32px] border border-amber-500/40 bg-gradient-to-b from-white via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-6 sm:p-8 space-y-6 shadow-md">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Финансови показатели</h3>
                    <p className="text-xs font-semibold text-slate-500">Захранва Сметка 611 (Животновъдство)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-800/50 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Дневен разход за 1 животно</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{dailyCostPerAnimal.toFixed(2)} лв / глава</p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4.5 space-y-1">
                    <span className="text-xs font-extrabold uppercase text-amber-800 dark:text-amber-300">Дневен разход за цялото стадо ({rationAnimalsCount} глави)</span>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{totalDailyHerdCost.toFixed(2)} лв / ден</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4.5 space-y-1">
                    <span className="text-xs font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Месечен разход за фураж (30 дни)</span>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalMonthlyHerdCost.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</p>
                    <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Отразява се в себестойността на млякото</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
