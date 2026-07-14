"use client";

import { useState } from "react";
import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Landmark, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  HelpCircle, 
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

type GrantRow = {
  id: string;
  schemeName: string;
  grantType: "area_operating" | "asset_capital";
  dfzReference: string;
  totalGrantEur: number;
  recognizedRevenueThisYearEur: number;
  deferredBalanceEur: number;
  accountingAccount: string;
  status: "active_amortizing" | "fully_recognized" | "expected";
};

const INITIAL_GRANTS: GrantRow[] = [
  {
    id: "g-1",
    schemeName: "СЕПП (Основно подпомагане на доходите за устойчивост)",
    grantType: "area_operating",
    dfzReference: "УРН-104581 / Кампания 2025",
    totalGrantEur: 68500.00,
    recognizedRevenueThisYearEur: 68500.00,
    deferredBalanceEur: 0,
    accountingAccount: "Сметка 709 (Други приходи от дейността / Субсидии)",
    status: "fully_recognized",
  },
  {
    id: "g-2",
    schemeName: "Мярка 4.1 „Инвестиции в земеделски стопанства“ (Нов Комбайн Claas)",
    grantType: "asset_capital",
    dfzReference: "ДОГ-ПРСР-41-0089 / 50% грант",
    totalGrantEur: 220000.00,
    recognizedRevenueThisYearEur: 27500.00, // 8 години живот на ДМА = 27,500/год
    deferredBalanceEur: 165000.00,
    accountingAccount: "Сметка 751 (Приходи за бъдещи периоди - ДМА)",
    status: "active_amortizing",
  },
  {
    id: "g-3",
    schemeName: "Екосхема за запазване и възстановяване на почвения капацитет",
    grantType: "area_operating",
    dfzReference: "УРН-104581 / Еко-2025",
    totalGrantEur: 14200.00,
    recognizedRevenueThisYearEur: 14200.00,
    deferredBalanceEur: 0,
    accountingAccount: "Сметка 709 (Други приходи от дейността / Субсидии)",
    status: "fully_recognized",
  },
  {
    id: "g-4",
    schemeName: "Подмярка 6.3 „Стартови помощи за развитие на малки стопанства“ (Соларни панели)",
    grantType: "asset_capital",
    dfzReference: "ДОГ-ПРСР-63-0142 / 100% грант",
    totalGrantEur: 25000.00,
    recognizedRevenueThisYearEur: 2500.00, // 10 години живот на солара
    deferredBalanceEur: 20000.00,
    accountingAccount: "Сметка 751 (Приходи за бъдещи периоди - ДМА)",
    status: "active_amortizing",
  },
];

export default function SubsidiiOpPage() {
  const [grants] = useState<GrantRow[]>(INITIAL_GRANTS);
  const [tabType, setTabType] = useState<string>("all");

  const filteredGrants = grants.filter((g) => {
    if (tabType === "all") return true;
    return g.grantType === tabType;
  });

  const totalGranted = grants.reduce((s, g) => s + g.totalGrantEur, 0);
  const totalRecognizedRevenue = grants.reduce((s, g) => s + g.recognizedRevenueThisYearEur, 0);
  const totalDeferredBalance = grants.reduce((s, g) => s + g.deferredBalanceEur, 0);

  return (
    <SitePageShell
      maxWidth="6xl"
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/moya-ferma/schetovodstvo"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ← Към Счетоводство
            </Link>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Евросубсидии и Финансирания (НСС 20 / МСС 20)</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Landmark size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Приходи за бъдещи периоди • Сметки 751 & 709</span>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Banner */}
        <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
              <Sparkles size={14} />
              <span>ДФЗ • ПРСР • Директни плащания</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Счетоводно отчитане на европейски субсидии по НСС 20
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Избягвайте данъчни удари от неправилно признаване на субсидии. Модулът автоматично разделя плащанията за площ (текущи приходи) от инвестиционните грантове за машини, като синхронизира прихода от субсидията съразмерно с месечната амортизация на актива.
            </p>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Общо договорени / получени субсидии</span>
              <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Landmark size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalGranted.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">По 4 активни програми и схеми</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">Признат приход за текущата 2025/2026 г.</span>
              <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">+{totalRecognizedRevenue.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Участва при формиране на печалбата</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-amber-500/40 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">Отложен приход за бъдещи години (Сметка 751)</span>
              <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400">
                <Clock size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-400">{totalDeferredBalance.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-extrabold text-amber-800 dark:text-amber-300">Амортизира се паралелно с ДМА</span>
          </div>
        </div>

        {/* Info card on NSS 20 standard */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-teal-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30 p-6 sm:p-8 flex flex-col sm:flex-row items-start justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-teal-600 dark:text-teal-400">
              <HelpCircle size={16} />
              <span>Златното счетоводно правило по НСС 20</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Защо не бива да признавате цялата инвестиционна субсидия наведнъж?
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Ако получите <strong>220 000 € субсидия по Мярка 4.1</strong> за комбайн и ги отчетете веднага като приход (Сметка 709), фермата ви ще отчете огромна изкуствена печалба и ще платите непосилен 10% корпоративен данък. <strong>НСС 20 (точка 5.1)</strong> изисква субсидията да се заведе в <strong>Сметка 751 „Финансирания за ДМА“</strong> и всеки месец автоматично да се признава само част от нея — точно равна на месечната амортизация на комбайна!
            </p>
          </div>
          <div className="shrink-0">
            <div className="rounded-2xl border border-teal-500/40 bg-teal-500/10 p-5 text-center max-w-xs space-y-1">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 block uppercase">Авто-синхронизация</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Модулът ДМА ↔ Субсидии е 100% обвързан</p>
            </div>
          </div>
        </div>

        {/* Table / Filters */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
            <div className="flex gap-2">
              <button
                onClick={() => setTabType("all")}
                className={cn(
                  "rounded-2xl px-5 py-2.5 text-xs font-extrabold transition",
                  tabType === "all" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                Всички финансирания ({grants.length})
              </button>
              <button
                onClick={() => setTabType("area_operating")}
                className={cn(
                  "rounded-2xl px-5 py-2.5 text-xs font-extrabold transition",
                  tabType === "area_operating" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                Директни плащания / Текущи приходи
              </button>
              <button
                onClick={() => setTabType("asset_capital")}
                className={cn(
                  "rounded-2xl px-5 py-2.5 text-xs font-extrabold transition",
                  tabType === "asset_capital" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                Инвестиционни грантове за ДМА (Сметка 751)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="pb-3.5">Програма / Схема и Референция ДФЗ</th>
                  <th className="pb-3.5">Тип субсидия</th>
                  <th className="pb-3.5 text-right">Общ размер (€)</th>
                  <th className="pb-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">Приход за годината (€)</th>
                  <th className="pb-3.5 text-right font-bold text-amber-600 dark:text-amber-400">Отложен остатък (751)</th>
                  <th className="pb-3.5">Счетоводна сметка</th>
                  <th className="pb-3.5 text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {filteredGrants.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{row.schemeName}</div>
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{row.dfzReference}</div>
                    </td>
                    <td className="py-4">
                      {row.grantType === "area_operating" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                          <span>Плащане за площ / текущо</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                          <span>Инвестиция в ДМА</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white">{row.totalGrantEur.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</td>
                    <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                      +{row.recognizedRevenueThisYearEur.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="py-4 text-right font-bold text-amber-600 dark:text-amber-400">
                      {row.deferredBalanceEur > 0 ? `${row.deferredBalanceEur.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €` : "0.00 €"}
                    </td>
                    <td className="py-4 font-mono text-xs text-slate-500 dark:text-slate-400 max-w-xs">{row.accountingAccount}</td>
                    <td className="py-4 text-center">
                      {row.status === "fully_recognized" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 size={13} />
                          <span>100% Призната</span>
                        </span>
                      )}
                      {row.status === "active_amortizing" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                          <Clock size={13} />
                          <span>Амортизира се</span>
                        </span>
                      )}
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
