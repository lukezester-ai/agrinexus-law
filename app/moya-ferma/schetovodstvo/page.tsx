"use client";

import { useState } from "react";
import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Landmark, 
  FileText, 
  Calculator, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Bot, 
  Users,
  Sprout,
  Fuel,
  Share2,
  Sparkles,
  CheckCircle2,
  PieChart,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";

type JournalEntry = {
  id: string;
  date: string;
  number: string;
  description: string;
  debit: number;
  credit: number;
  status: string;
};

const DEMO_ENTRIES: JournalEntry[] = [
  { id: "1", date: "15.10.2025", number: "2025-00142", description: "Наем офис и склад (Сметка 602)", debit: 1200, credit: 0, status: "posted" },
  { id: "2", date: "16.10.2025", number: "2025-00143", description: "Фактура дизелово гориво (Сметка 6013)", debit: 1470.00, credit: 0, status: "posted" },
  { id: "3", date: "18.10.2025", number: "2025-00144", description: "Продажба 120 тона пшеница (Сметка 701)", debit: 0, credit: 25800, status: "posted" },
  { id: "4", date: "20.10.2025", number: "2025-00145", description: "Изплатена рента по договори (Сметки 499/602)", debit: 7049.25, credit: 0, status: "posted" },
  { id: "5", date: "22.10.2025", number: "2025-00146", description: "Удържан данък 10% върху рента (НАП Чл. 38)", debit: 783.25, credit: 0, status: "draft" },
];

export default function SchetovodstvoPage() {
  const [entries] = useState<JournalEntry[]>(DEMO_ENTRIES);

  const totals = entries.reduce((acc, e) => ({
    debit: acc.debit + e.debit,
    credit: acc.credit + e.credit,
  }), { debit: 10502.50, credit: 25800.00 });

  return (
    <SitePageShell
      maxWidth="6xl"
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Земеделско Счетоводство & Аналитика</span>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>НСС 41 / МСС 41 • 100% НАП Съвместимост</span>
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Banner Hero */}
        <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
              <Sprout size={14} />
              <span>Специализирано за фермери и стопанства</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Финансово-счетоводен център на стопанството
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Управлявайте не просто стандартни фактури и дневници, а пълна аналитична себестойност на дка и тон, изплащане на ренти с данък 10%, възстановяване на акциз за гориво и автоматичен експорт за външната ви счетоводна кантора.
            </p>
          </div>
        </div>

        {/* Top Financial Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Приходи за периода (Сметка 701)</span>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              {totals.credit.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €
            </p>
            <span className="mt-1 block text-xs font-bold text-emerald-600 dark:text-emerald-400">Реколта 2025 • Реализирана продукция</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Направени разходи (Група 60)</span>
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                <ArrowDownRight size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              {totals.debit.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €
            </p>
            <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Семена, торове, горива и рента</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">Очаквана оперативна печалба</span>
              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-600 dark:text-emerald-400">
                <BarChart3 size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              +{(totals.credit - totals.debit).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €
            </p>
            <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Марж на печалба: {(((totals.credit - totals.debit) / totals.credit) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Section 1: Specialized Agri Accounting Modules (NEW) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-emerald-600 dark:text-emerald-400" />
                <span>Специализирани земеделски модули (НСС 41 & ЗДДФЛ)</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Разработени специално за нуждите на българските земеделски производители</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
              Ново • 5 Модула
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/moya-ferma/schetovodstvo/sebestoynost"
              className="group glass-panel-pro rounded-3xl p-6 border border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 text-white shadow-md shadow-emerald-500/20">
                    <PieChart size={24} />
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                    НСС 41
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Аналитична себестойност
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Разпределение на разходи за семена, торове, гориво и рента по култури. Калкулатор за себестойност на дка/тон и симулатор на рентабилност.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <span>Към калкулатора</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/renti"
              className="group glass-panel-pro rounded-3xl p-6 border border-fuchsia-500/30 hover:border-fuchsia-500/60 bg-gradient-to-br from-fuchsia-500/5 via-white to-white dark:from-fuchsia-950/20 dark:via-slate-900 dark:to-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-fuchsia-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 p-3.5 text-white shadow-md shadow-fuchsia-500/20">
                    <FileSpreadsheet size={24} />
                  </div>
                  <span className="rounded-full bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                    НАП Чл. 38
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                  Ренти и Данък 10%
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ведомости за изплащане на рента в пари или зърно. Автоматично удържане на окончателния данък 10% и експорт на Декларации чл. 55 / чл. 73.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                <span>Към ведомостите</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/goriva"
              className="group glass-panel-pro rounded-3xl p-6 border border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/5 via-white to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-3.5 text-white shadow-md shadow-blue-500/20">
                    <Fuel size={24} />
                  </div>
                  <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                    ДФЗ Акциз
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Акциз горива и Пътни листи
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Дневник на ГСМ по агро-норми и моточасове. Подготовка на заявления и файлове за възстановяване на акциз на газьол към ДФЗ (СЕУ).
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-blue-600 dark:text-blue-400">
                <span>Към горива</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/subsidii-op"
              className="group glass-panel-pro rounded-3xl p-6 border border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-br from-amber-500/5 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-3.5 text-white shadow-md shadow-amber-500/20">
                    <Landmark size={24} />
                  </div>
                  <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                    НСС 20
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Евросубсидии и Финансирания
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Разпределение на инвестиционни грантове (Сметка 751) паралелно с амортизациите на ДМА и признаване на директните плащания (СЕПП).
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-amber-600 dark:text-amber-400">
                <span>Към субсидии</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/export"
              className="group glass-panel-pro rounded-3xl p-6 border border-teal-500/30 hover:border-teal-500/60 bg-gradient-to-br from-teal-500/5 via-white to-white dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-500/10 flex flex-col justify-between sm:col-span-2 lg:col-span-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 p-3.5 text-white shadow-md shadow-teal-500/20">
                    <Share2 size={24} />
                  </div>
                  <span className="rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                    Бизнес Навигатор • Микроинвест • Ажур
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Мост със Счетоводна кантора и Експорт на файлове
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Генерирайте готови за импорт XML/CSV пакети за българските счетоводни програми (Бизнес Навигатор, Микроинвест Делта Про, Ажур-L, Плюс Минус) или предоставете защитен портален достъп на вашия външен счетоводител за директна обмяна.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-teal-600 dark:text-teal-400">
                <span>Към експортния център и портала</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Section 2: Core Accounting Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-slate-700 dark:text-slate-300" />
                <span>Основни счетоводни регистри</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Стандартни модули за първични счетоводни документи и баланси</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/moya-ferma/schetovodstvo/smetkovodstvo"
              className="group rounded-3xl border border-slate-200/90 bg-white/90 p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-600 flex items-center gap-4"
            >
              <div className="rounded-2xl bg-teal-100 p-3.5 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Журнал на записите</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Хронологични счетоводни операции</p>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/smetki"
              className="group rounded-3xl border border-slate-200/90 bg-white/90 p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-600 flex items-center gap-4"
            >
              <div className="rounded-2xl bg-blue-100 p-3.5 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Фактури и Документи</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Продажби, покупки и проформи</p>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/klienti"
              className="group rounded-3xl border border-slate-200/90 bg-white/90 p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-600 flex items-center gap-4"
            >
              <div className="rounded-2xl bg-indigo-100 p-3.5 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Контрагенти</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Клиенти, доставчици, ЕИК и ДДС статус</p>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/balance"
              className="group rounded-3xl border border-slate-200/90 bg-white/90 p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-600 flex items-center gap-4"
            >
              <div className="rounded-2xl bg-purple-100 p-3.5 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Баланс и Оборотна</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Финансови отчети и ОПП</p>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/danaci"
              className="group rounded-3xl border border-slate-200/90 bg-white/90 p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-600 flex items-center gap-4"
            >
              <div className="rounded-2xl bg-amber-100 p-3.5 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
                <Landmark size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Данъци и ДДС дневници</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Справки-декларации и VIES</p>
              </div>
            </Link>

            <Link
              href="/moya-ferma/schetovodstvo/ai"
              className="group rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5 transition hover:border-purple-500 hover:shadow-md dark:border-purple-500/40 dark:bg-purple-950/20 flex items-center gap-4 sm:col-span-2 lg:col-span-1"
            >
              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-3.5 text-white shrink-0 shadow-md shadow-purple-500/30">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">AI Счетоводен асистент</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Задайте въпрос на естествен език за баланс или ДДС</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Journal Entries Table */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
          <div className="border-b border-slate-200/80 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-slate-900 dark:text-white">
              <FileText size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span>Последни автоматизирани записи в журнала</span>
            </h2>
            <Link
              href="/moya-ferma/schetovodstvo/smetkovodstvo"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Виж целия журнал →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">Дата</th>
                  <th className="p-4">Номер на ордер</th>
                  <th className="p-4">Описание на операцията</th>
                  <th className="p-4 text-right">Дебит (€)</th>
                  <th className="p-4 text-right">Кредит (€)</th>
                  <th className="p-4 text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{e.date}</td>
                    <td className="p-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{e.number}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">{e.description}</td>
                    <td className="p-4 text-right font-black text-slate-900 dark:text-white">{e.debit > 0 ? `${e.debit.toFixed(2)} €` : "—"}</td>
                    <td className="p-4 text-right font-black text-slate-900 dark:text-white">{e.credit > 0 ? `${e.credit.toFixed(2)} €` : "—"}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${e.status === "posted" ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 dark:text-emerald-300" : "bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:text-amber-300"}`}>
                        {e.status === "posted" ? "● Осчетоводено" : "○ Чернова"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SitePageShell>
  );
}
