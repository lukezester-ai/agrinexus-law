"use client";

import { useState } from "react";
import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  FileSpreadsheet, 
  Users, 
  DollarSign, 
  Landmark, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText, 
  Search,
  Filter,
  PlusCircle,
  Wheat
} from "lucide-react";
import { cn } from "@/lib/utils";

type RentPaymentRow = {
  id: string;
  landlordName: string;
  egnOrBulstat: string;
  contractNumber: string;
  areaDka: number;
  rentType: "cash" | "grain" | "mixed";
  agreedRateEurPerDka: number;
  grossAmountEur: number;
  tax10PercentEur: number;
  netPayoutEur: number;
  paymentStatus: "paid_bank" | "paid_grain" | "pending";
  paymentDate?: string;
};

const INITIAL_RENTS: RentPaymentRow[] = [
  {
    id: "r1",
    landlordName: "Георги Димитров Иванов",
    egnOrBulstat: "580412**** (ФЛ)",
    contractNumber: "ДОГ-2023-014 / 10 год.",
    areaDka: 120.5,
    rentType: "cash",
    agreedRateEurPerDka: 65,
    grossAmountEur: 7832.50,
    tax10PercentEur: 783.25,
    netPayoutEur: 7049.25,
    paymentStatus: "paid_bank",
    paymentDate: "14.10.2025",
  },
  {
    id: "r2",
    landlordName: "Елена Стефанова Петрова",
    egnOrBulstat: "641123**** (ФЛ)",
    contractNumber: "ДОГ-2022-089 / 7 год.",
    areaDka: 85.0,
    rentType: "cash",
    agreedRateEurPerDka: 65,
    grossAmountEur: 5525.00,
    tax10PercentEur: 552.50,
    netPayoutEur: 4972.50,
    paymentStatus: "paid_bank",
    paymentDate: "18.10.2025",
  },
  {
    id: "r3",
    landlordName: "Иван Николов Колев",
    egnOrBulstat: "520809**** (ФЛ)",
    contractNumber: "ДОГ-2024-003 / 10 год.",
    areaDka: 210.0,
    rentType: "grain",
    agreedRateEurPerDka: 65,
    grossAmountEur: 13650.00,
    tax10PercentEur: 1365.00,
    netPayoutEur: 12285.00,
    paymentStatus: "paid_grain",
    paymentDate: "05.11.2025 (45.5 тона зърно)",
  },
  {
    id: "r4",
    landlordName: "Мария Василева Тодорова",
    egnOrBulstat: "710315**** (ФЛ)",
    contractNumber: "ДОГ-2023-112 / 5 год.",
    areaDka: 64.0,
    rentType: "cash",
    agreedRateEurPerDka: 65,
    grossAmountEur: 4160.00,
    tax10PercentEur: 416.00,
    netPayoutEur: 3744.00,
    paymentStatus: "pending",
  },
  {
    id: "r5",
    landlordName: "„Агро Инвест Земя“ ЕООД",
    egnOrBulstat: "204581290 (ЮЛ)",
    contractNumber: "ДОГ-2021-045 / 15 год.",
    areaDka: 450.0,
    rentType: "cash",
    agreedRateEurPerDka: 65,
    grossAmountEur: 29250.00,
    tax10PercentEur: 0, // ЮЛ фактурира с ДДС/без данък чл 38
    netPayoutEur: 29250.00,
    paymentStatus: "paid_bank",
    paymentDate: "01.10.2025",
  },
];

export default function RentiPage() {
  const [rows, setRows] = useState<RentPaymentRow[]>(INITIAL_RENTS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("Q4-2025");
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [declarationType, setDeclarationType] = useState<"chl55" | "chl73">("chl55");

  const filteredRows = rows.filter((r) => {
    const matchesSearch = r.landlordName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === "all") return true;
    return r.paymentStatus === filterStatus;
  });

  const totalArea = rows.reduce((s, r) => s + r.areaDka, 0);
  const totalGross = rows.reduce((s, r) => s + r.grossAmountEur, 0);
  const totalTax = rows.reduce((s, r) => s + r.tax10PercentEur, 0);
  const totalNet = rows.reduce((s, r) => s + r.netPayoutEur, 0);
  const pendingCount = rows.filter((r) => r.paymentStatus === "pending").length;

  const handlePayRow = (id: string, type: "paid_bank" | "paid_grain") => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, paymentStatus: type, paymentDate: "Днес" } : r));
  };

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
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Рентни ведомости и Данък 10% (ЗДДФЛ)</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 px-3.5 py-1 text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">
            <Landmark size={14} className="text-fuchsia-600 dark:text-fuchsia-400" />
            <span>НАП Съвместимост • Чл. 38, Чл. 55, Чл. 73</span>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Banner */}
        <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600/20 border border-fuchsia-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300 mb-3">
              <FileSpreadsheet size={14} />
              <span>Арендни плащания и удръжки</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Рентни ведомости за Стопанска 2025/2026 година
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Автоматично начисляване на рента (в пари или зърно) към стотици собственици на земя. Модулът удържа задължителния <strong>10% окончателен данък по чл. 38 от ЗДДФЛ</strong> и генерира справките за НАП с едно кликване.
            </p>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Общо наета площ</span>
              <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Users size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalArea.toLocaleString("bg-BG")} <span className="text-base font-bold text-slate-400">дка</span></p>
            <span className="mt-1 block text-xs font-bold text-emerald-600 dark:text-emerald-400">По 5 активни арендни договора</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Общо дължима рента</span>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalGross.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Средна ставка: 65 €/дка</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-50/80 to-white dark:from-fuchsia-950/30 dark:to-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-fuchsia-700 dark:text-fuchsia-300">Удържан данък 10% (НАП)</span>
              <div className="rounded-xl bg-fuchsia-500/15 p-2.5 text-fuchsia-600 dark:text-fuchsia-400">
                <Landmark size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-fuchsia-600 dark:text-fuchsia-400">{totalTax.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-extrabold text-fuchsia-800 dark:text-fuchsia-300">За деклариране по чл. 55 / чл. 73</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">За изплащане (Нето)</span>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                <AlertCircle size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalNet.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-bold text-amber-600 dark:text-amber-400">{pendingCount} собственици очакват плащане</span>
          </div>
        </div>

        {/* NAP Declaration Generator Bar */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-fuchsia-300">
              <Landmark size={14} />
              <span>НАП Електронно деклариране</span>
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Генериране на задължителни декларации за ренти</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              Спестете дни ръчно въвеждане. Модулът експортира директен XML/CSV файл за системата на НАП с коректно изчислени лични данни, кодове за доходи и удържан данък.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => { setDeclarationType("chl55"); setShowDeclarationModal(true); }}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/20 shadow-sm flex items-center gap-2"
            >
              <FileText size={16} className="text-amber-300" />
              <span>Декларация чл. 55 (Тримесечие)</span>
            </button>
            <button
              onClick={() => { setDeclarationType("chl73"); setShowDeclarationModal(true); }}
              className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:scale-[1.03] shadow-md shadow-fuchsia-500/30 flex items-center gap-2"
            >
              <Download size={16} />
              <span>Годишна справка чл. 73, ал. 1</span>
            </button>
          </div>
        </div>

        {/* Table Toolbar & Search */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търси по име на арендодател, ЕГН или номер на договор..."
                className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter size={14} /> Статус:
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Всички ({rows.length})</option>
                <option value="paid_bank">Изплатени по банка</option>
                <option value="paid_grain">Изплатени в натура (Зърно)</option>
                <option value="pending">Очакващи плащане</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="pb-3.5">Арендодател / ЕГН & Договор</th>
                  <th className="pb-3.5 text-right">Площ (Дка)</th>
                  <th className="pb-3.5 text-right">Бруто рента (€)</th>
                  <th className="pb-3.5 text-right text-fuchsia-600 dark:text-fuchsia-400">Данък 10% (€)</th>
                  <th className="pb-3.5 text-right font-black text-slate-900 dark:text-white">Нето за изплащане</th>
                  <th className="pb-3.5 text-center">Статус и Дата</th>
                  <th className="pb-3.5 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{row.landlordName}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{row.egnOrBulstat} • <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{row.contractNumber}</span></div>
                    </td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white">{row.areaDka}</td>
                    <td className="py-4 text-right font-bold text-slate-700 dark:text-slate-300">{row.grossAmountEur.toFixed(2)} €</td>
                    <td className="py-4 text-right font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                      {row.tax10PercentEur > 0 ? `${row.tax10PercentEur.toFixed(2)} €` : "0.00 € (Освободен)"}
                    </td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-white text-base">
                      {row.netPayoutEur.toFixed(2)} €
                    </td>
                    <td className="py-4 text-center">
                      {row.paymentStatus === "paid_bank" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 size={13} />
                          <span>Банка ({row.paymentDate})</span>
                        </span>
                      )}
                      {row.paymentStatus === "paid_grain" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                          <Wheat size={13} />
                          <span>Натура ({row.paymentDate})</span>
                        </span>
                      )}
                      {row.paymentStatus === "pending" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                          <AlertCircle size={13} />
                          <span>Очаква плащане</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {row.paymentStatus === "pending" ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handlePayRow(row.id, "paid_bank")}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition"
                            title="Изплати по банка"
                          >
                            Плати (€)
                          </button>
                          <button
                            onClick={() => handlePayRow(row.id, "paid_grain")}
                            className="rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition flex items-center gap-1"
                            title="Изплати в зърно от склад"
                          >
                            <Wheat size={12} /> Зърно
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => alert(`Генериран разходен ордер и служебни бележки за ${row.landlordName}`)}
                          className="text-xs font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
                        >
                          Ордер / Бележка
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal simulating NAP Declaration generation */}
        {showDeclarationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="glass-panel-pro rounded-[32px] border border-fuchsia-500/40 bg-white dark:bg-slate-900 p-8 max-w-xl w-full shadow-2xl space-y-6">
              <div className="flex items-center gap-3 text-fuchsia-600 dark:text-fuchsia-400">
                <div className="rounded-2xl bg-fuchsia-500/15 p-3">
                  <Landmark size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {declarationType === "chl55" ? "Декларация по чл. 55, ал. 1 от ЗДДФЛ" : "Годишна справка по чл. 73, ал. 1 от ЗДДФЛ"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Генерирано за НАП (Портал за електронни услуги)</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-5 space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Данъчно задължено лице (Платник):</span>
                  <strong className="text-slate-900 dark:text-white">АгриНексус Стопанство ЕИК 205991823</strong>
                </div>
                <div className="flex justify-between">
                  <span>Период на деклариране:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">4-то тримесечие / 2025 г.</strong>
                </div>
                <div className="flex justify-between">
                  <span>Брой физически лица (арендодатели):</span>
                  <strong className="text-slate-900 dark:text-white">4 лица</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm font-black">
                  <span>Общо дължим окончателен данък (10%):</span>
                  <span className="text-fuchsia-600 dark:text-fuchsia-400">{totalTax.toFixed(2)} €</span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Файлът е генериран във валиден <strong>XML формат (NAP e-Services schema v4.2)</strong> и е готов за подписване с Квалифициран Електронен Подпис (КЕП).
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeclarationModal(false)}
                  className="rounded-2xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Затвори
                </button>
                <button
                  onClick={() => {
                    alert(`Изтеглихте ${declarationType === "chl55" ? "NAP_Chl55_Q4_2025.xml" : "NAP_Chl73_2025_Annual.xml"}`);
                    setShowDeclarationModal(false);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-fuchsia-500/30 hover:scale-[1.02]"
                >
                  Изтегли XML за НАП
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
