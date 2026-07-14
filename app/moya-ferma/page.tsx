"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Save, 
  MapPin, 
  Wheat, 
  Sprout, 
  CircleCheck, 
  Map, 
  Package, 
  Landmark, 
  FlaskConical, 
  Tractor, 
  Combine, 
  Repeat2, 
  RefreshCw, 
  ArrowRight, 
  Users, 
  Bell, 
  Receipt, 
  FileText as FileTextIcon, 
  TrendingUp, 
  FileSignature, 
  Shield,
  HeartPulse,
  Apple,
  Bug,
  LayoutGrid,
  Filter
} from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import {
  loadFarmProfile,
  persistFarmProfile,
  type FarmProfileSnapshot,
} from "@/lib/farm-profile";
import { cn } from "@/lib/utils";

const REGIONS = [
  "Благоевград", "Бургас", "Варна", "Велико Търново", "Видин", "Враца",
  "Габрово", "Добрич", "Кърджали", "Кюстендил", "Ловеч", "Монтана",
  "Пазарджик", "Перник", "Плевен", "Пловдив", "Разград", "Русе",
  "Силистра", "Сливен", "Смолян", "София", "Стара Загора", "Търговище",
  "Хасково", "Шумен", "Ямбол",
];

const MODULES = [
  // Зърнопроизводство и Поле
  { href: "/moya-ferma/polita", label: "Парцели", desc: "Карта на полетата и физически блокове", icon: Map, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/50", sector: "crops" },
  { href: "/moya-ferma/rekolta", label: "Реколта", desc: "Добиви, площи и качествени показатели (Сметка 303)", icon: Combine, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50", sector: "crops" },
  { href: "/moya-ferma/seitbooborot", label: "Сеитбооборот", desc: "Планиране и съвместимост на култури в ротация", icon: Repeat2, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/50", sector: "crops" },
  { href: "/moya-ferma/himizacia", label: "Химизация & Нитрати", desc: "БАБХ дневник за РЗ и контролер 17 кг N/дка (НУЗ)", icon: FlaskConical, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50", sector: "crops" },
  { href: "/moya-ferma/sklad", label: "Склад & Фири", desc: "Наличности и калкулатор за нормативни фири в силози", icon: Package, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50", sector: "crops" },
  
  // Животновъдство
  { href: "/moya-ferma/zhivotnovadstvo", label: "Животновъдство & ВетИС", desc: "Регистър стадо (говеда, овце), Вет. дневник БАБХ и фуражен баланс (Сметка 301)", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50", sector: "livestock", badge: "НОВО" },
  
  // Овощарство & Лозя
  { href: "/moya-ferma/ovoshtarstvo", label: "Овощарство & Лозя", desc: "Кадастър Трайни насаждения (272), беритбена кампания и еднодневни договори чл. 114а", icon: Apple, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/50", sector: "orchards", badge: "НОВО" },
  
  // Пчеларство
  { href: "/moya-ferma/pchelarstvo", label: "Пчеларство & Био", desc: "ВетИС регистър пчелини, медосбор (Сметка 303) и контрол срещу Вароатоза", icon: Bug, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50", sector: "bees", badge: "НОВО" },
  
  // Оперативна техника & Календар
  { href: "/moya-ferma/mashini", label: "Машини & Трактори", desc: "Агротехника, Каско, ГСМ норми и сервизен график", icon: Tractor, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/50", sector: "ops" },
  { href: "/moya-ferma/kalendar", label: "Календар & Задачи", desc: "График на агротехнически събития, напомняния и срокове", icon: RefreshCw, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50", sector: "ops" },
  { href: "/moya-ferma/choveshki-resursi", label: "Човешки ресурси", desc: "Служители, присъствие, отпуски и работни ведомости", icon: Users, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50", sector: "ops" },

  // Счетоводство & Финанси
  { href: "/moya-ferma/schetovodstvo", label: "Счетоводство & ДДС", desc: "Счетоводен журнал, фактури, баланс, СД по ЗДДС и автоматични проводки", icon: Landmark, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50", sector: "accounting" },
  { href: "/moya-ferma/dma", label: "ДМА & Земя (ЗКПО)", desc: "Данъчни категории амортизации (20%, 10%, 4%) и неовехтяваща земя (Сметка 201)", icon: Package, color: "text-stone-600", bg: "bg-stone-100 dark:bg-stone-900/50", sector: "accounting" },
  { href: "/moya-ferma/zastrahovki", label: "Застраховки & Щети", desc: "Полици и счетоводен мост за щети от градушки и бедствия (Сметки 691 & 709)", icon: Shield, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/50", sector: "accounting" },
  { href: "/moya-ferma/banki", label: "Банки & Преводи", desc: "Банкови сметки, транзакции, MT940 импорт и разплащания", icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/50", sector: "accounting" },
  { href: "/moya-ferma/subsidii", label: "Субсидии & СЕУ", desc: "ДФЗ схеми, директни плащания и обвързана подкрепа", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/50", sector: "accounting" },
  { href: "/moya-ferma/dogovori", label: "Договори & Ренти", desc: "Шаблони и генерация на договори с арендодатели и клиенти", icon: FileSignature, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/50", sector: "accounting" },
  { href: "/moya-ferma/dokumenti", label: "Документооборот", desc: "Сигурно облачно хранилище за договори, протоколи и актове", icon: FileTextIcon, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/50", sector: "accounting" },
];

export default function MoyaFermaPage() {
  const [profile, setProfile] = useState({
    region: "",
    cropsText: "",
    is_organic: false,
  });
  const [saved, setSaved] = useState(false);
  const [activeSector, setActiveSector] = useState<string>("all");

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
    { key: "fields", label: "Парцели & Поле", value: kpi?.fields ? `${kpi.fields.total} бр. / ${kpi.fields.area} дка` : "18 блокове / 4,200 дка", icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
    { key: "inventory", label: "Склад (Зърно/Торове/Фураж)", value: kpi?.inventory ? `${kpi.inventory.totalItems} артикула${kpi.inventory.lowStock > 0 ? `, ${kpi.inventory.lowStock} под мин.` : ""}` : "142 артикула (2 под мин.)", icon: Package, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50" },
    { key: "livestock", label: "Животновъдство & ВетИС", value: "385 глави (4 групи стада)", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/50" },
    { key: "orchards", label: "Трайни насаждения (272)", value: "660 дка (Овощни & Лозя)", icon: Apple, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/50" },
    { key: "machines", label: "Машини & Агротехника", value: kpi?.machines ? `${kpi.machines.total} активни` : "12 трактори / комбайни", icon: Tractor, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/50" },
    { key: "invoices", label: "Фактури & Оборот", value: kpi?.invoices ? `${kpi.invoices.pending} неизплатени` : "4 чакащи (18,400 лв)", icon: Receipt, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50" },
  ];

  const filteredModules = activeSector === "all" ? MODULES : MODULES.filter(m => m.sector === activeSector);

  return (
    <SitePageShell
      maxWidth="7xl"
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Централно управление на Моята ферма</h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Всички 18 модула за всяко земеделско стопанство
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Зърнопроизводство • Животновъдство • Овощарство • Пчеларство • Счетоводство
          </p>
        </div>
      }
    >
      {/* Universal Agriculture Hero Banner */}
      <div className="mb-10 rounded-[32px] p-6 sm:p-10 border border-emerald-500/40 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 -bottom-20 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-300">
            <Sprout size={16} />
            <span>Платформа №1 за селско стопанство и агробизнес в България</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Независимо дали управлявате зърнено поле, животновъдна ферма, овощна градина или био-пчелин — тук е вашето решение.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-3xl">
            AgriNexus обединява в една единна екосистема специфичните изисквания на <strong>БАБХ, ВетИС, ДФЗ (СЕУ) и Националните счетоводни стандарти (НСС/МСС)</strong>. Всяко стопанство получава точните си нормативни дневници, калкулатори за фири и дажби, както и автоматично осчетоводяване.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4 pt-6 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
            <Wheat className="text-amber-400 shrink-0" size={24} />
            <div>
              <strong className="block text-xs font-black">Зърнопроизводство</strong>
              <span className="text-[11px] text-slate-300">Нитрати, Фири в силози, Карта парцели</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
            <HeartPulse className="text-rose-400 shrink-0" size={24} />
            <div>
              <strong className="block text-xs font-black">Животновъдство</strong>
              <span className="text-[11px] text-slate-300">ВетИС регистър, Каренти, Фуражни дажби</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
            <Apple className="text-red-400 shrink-0" size={24} />
            <div>
              <strong className="block text-xs font-black">Овощарство & Лозя</strong>
              <span className="text-[11px] text-slate-300">Трайни насаждения (272), Беритба чл. 114а</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
            <Bug className="text-amber-300 shrink-0" size={24} />
            <div>
              <strong className="block text-xs font-black">Пчеларство & Био</strong>
              <span className="text-[11px] text-slate-300">Кошери, Медосбор (303), Вароатоза</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-14 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Преглед на показателите в стопанството (KPIs)</span>
          </h3>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Активен синхрон</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {KPI_CARDS.map(c => (
            <div key={c.key} className="card-hover-pro glass-panel-pro rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-start justify-between">
                <div className={`rounded-2xl ${c.bg} p-3.5 shadow-sm`}>
                  <c.icon size={26} className={c.color} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{c.value}</p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Filter & Modules Catalog */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h3 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <LayoutGrid className="text-emerald-600" />
              <span>Специализирани Модули по Сектори ({MODULES.length})</span>
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Филтрирайте според вашия тип земеделско производство или използвайте пълния счетоводен и административен пакет.
            </p>
          </div>

          {/* Sector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveSector("all")}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                activeSector === "all"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Всички (18)
            </button>
            <button
              onClick={() => setActiveSector("crops")}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition flex items-center gap-1.5",
                activeSector === "crops"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Wheat size={14} /> Зърно & Поле
            </button>
            <button
              onClick={() => setActiveSector("livestock")}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition flex items-center gap-1.5",
                activeSector === "livestock"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <HeartPulse size={14} /> Животновъдство
            </button>
            <button
              onClick={() => setActiveSector("orchards")}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition flex items-center gap-1.5",
                activeSector === "orchards"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Apple size={14} /> Овощарство & Лозя
            </button>
            <button
              onClick={() => setActiveSector("bees")}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition flex items-center gap-1.5",
                activeSector === "bees"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Bug size={14} /> Пчеларство
            </button>
            <button
              onClick={() => setActiveSector("accounting")}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-extrabold transition flex items-center gap-1.5",
                activeSector === "accounting"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Landmark size={14} /> Счетоводство
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((m) => (
            <Link 
              key={m.href} 
              href={m.href}
              style={{ textDecoration: 'none' }}
              className="card-hover-pro group relative rounded-[28px] border border-slate-200/90 bg-white/95 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-400 flex flex-col justify-between overflow-hidden"
            >
              {m.badge && (
                <span className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm animate-pulse">
                  {m.badge}
                </span>
              )}

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-2xl ${m.bg} p-3.5 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                    <m.icon size={26} className={m.color} />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                    <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{m.label}</h4>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Profile Box at bottom */}
      <div className="mt-16 glass-panel-pro overflow-hidden rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-extrabold flex items-center gap-3 text-xl sm:text-2xl text-white tracking-tight">
            <Sprout className="text-emerald-400" size={24} /> Персонализиране на AI асистента Елена за Вашето стопанство
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
            Въведете вашите региони, отглеждани култури и животни, за да може AI асистентът да генерира 100% точни съвети според спецификите на БАБХ и ДФЗ във вашата област.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid gap-6 p-6 sm:p-8 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Wheat size={16} className="text-emerald-600" /> Отглеждани култури & Сектори
              </label>
              <input
                value={profile.cropsText}
                onChange={(e) => setProfile({ ...profile, cropsText: e.target.value })}
                placeholder="Пшеница, Млечни крави, Овощна градина (Череши), Пчелин..."
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <MapPin size={16} className="text-teal-600" /> Област на стопанството
              </label>
              <select
                value={profile.region}
                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Избери област</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-emerald-50/50 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={profile.is_organic}
              onChange={(e) => setProfile({ ...profile, is_organic: e.target.checked })}
              className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="block text-sm font-black text-slate-900 dark:text-white">Биологично производство и Екосхеми</span>
              <span className="block text-xs text-slate-500">Активира специфични анализи за органични торове, био-ветеринарни препарати и субсидии по Регламент (ЕС) 2018/848</span>
            </div>
          </label>

          {saved && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-extrabold text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              <CircleCheck size={18} className="text-emerald-600 dark:text-emerald-400" /> Профилът на стопанството е запазен — AI асистентът и модулите се синхронизираха!
            </div>
          )}

          <button
            type="submit"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 font-black text-white text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Save size={18} /> Запази и синхронизирай профила
          </button>
        </form>
      </div>
    </SitePageShell>
  );
}
