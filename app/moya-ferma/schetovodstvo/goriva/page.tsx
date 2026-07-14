"use client";

import { useState } from "react";
import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Fuel, 
  Truck, 
  FileCheck, 
  Download, 
  Calculator, 
  CheckCircle2, 
  Filter, 
  FileText,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type WorkingSheetRow = {
  id: string;
  date: string;
  sheetNumber: string;
  machineName: string;
  operatorName: string;
  operationType: string;
  fieldIdAndArea: string;
  normLitresPerDka: number;
  totalLitresUsed: number;
  dieselCostEur: number;
  eligibleForExciseRefund: boolean;
};

const INITIAL_SHEETS: WorkingSheetRow[] = [
  {
    id: "ws-101",
    date: "12.10.2025",
    sheetNumber: "ПЛ-2025-0412",
    machineName: "Трактор John Deere 8R 370",
    operatorName: "Петър Христов",
    operationType: "Дълбока оран (Сметка 6111 - Пшеница)",
    fieldIdAndArea: "Масив „Слатина“ (420 дка)",
    normLitresPerDka: 2.8,
    totalLitresUsed: 1176,
    dieselCostEur: 1470.00,
    eligibleForExciseRefund: true,
  },
  {
    id: "ws-102",
    date: "14.10.2025",
    sheetNumber: "ПЛ-2025-0415",
    machineName: "Комбайн Claas Lexion 8800",
    operatorName: "Стефан Димитров",
    operationType: "Жътва слънчоглед (Сметка 6111 - Слънчоглед)",
    fieldIdAndArea: "Масив „Долни Дъбник“ (610 дка)",
    normLitresPerDka: 1.9,
    totalLitresUsed: 1159,
    dieselCostEur: 1448.75,
    eligibleForExciseRefund: true,
  },
  {
    id: "ws-103",
    date: "18.10.2025",
    sheetNumber: "ПЛ-2025-0419",
    machineName: "Трактор John Deere 6155M",
    operatorName: "Иван Колев",
    operationType: "Предсеитбено дисковане",
    fieldIdAndArea: "Масив „Ливадите“ (350 дка)",
    normLitresPerDka: 1.4,
    totalLitresUsed: 490,
    dieselCostEur: 612.50,
    eligibleForExciseRefund: true,
  },
  {
    id: "ws-104",
    date: "20.10.2025",
    sheetNumber: "ПЛ-2025-0422",
    machineName: "Товарен пикап Toyota Hilux",
    operatorName: "Георги Иванов (Агроном)",
    operationType: "Обход на полета и администрация",
    fieldIdAndArea: "Всички парцели (Общи разходи 609)",
    normLitresPerDka: 0,
    totalLitresUsed: 85,
    dieselCostEur: 106.25,
    eligibleForExciseRefund: false, // Пикап/транспорт не влиза в първично производство
  },
];

export default function GorivaPage() {
  const [sheets] = useState<WorkingSheetRow[]>(INITIAL_SHEETS);
  const [filterEligible, setFilterEligible] = useState<string>("all");
  const [refundRateEurPerLitre, setRefundRateEurPerLitre] = useState<number>(0.21); // ~0.41 лв/литър
  const [showVouchersModal, setShowVouchersModal] = useState(false);

  const filteredSheets = sheets.filter((s) => {
    if (filterEligible === "eligible") return s.eligibleForExciseRefund;
    if (filterEligible === "non-eligible") return !s.eligibleForExciseRefund;
    return true;
  });

  const totalLitresUsed = sheets.reduce((a, b) => a + b.totalLitresUsed, 0);
  const eligibleLitres = sheets.filter((s) => s.eligibleForExciseRefund).reduce((a, b) => a + b.totalLitresUsed, 0);
  const totalCost = sheets.reduce((a, b) => a + b.dieselCostEur, 0);
  const estimatedRefundEur = eligibleLitres * refundRateEurPerLitre;

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
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Акциз горива и Пътни листи (ДФЗ & Митници)</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
            <Fuel size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Възстановяване на акциз • Електронни ваучери ДФЗ</span>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Banner */}
        <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-3">
              <Truck size={14} />
              <span>ГСМ Контрол и Държавни помощи</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Счетоводен дневник на горивата и възстановяване на акциз
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Обвържете закупения дизел по фактури с реалните пътни и работни листи на техниката. Калкулирайте допустимото количество за <strong>възстановяване на акциз за газьол</strong>, използван в първичното производство съгласно изискванията на ДФЗ и Агенция „Митници“.
            </p>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Общо изразходвано гориво</span>
              <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Fuel size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalLitresUsed.toLocaleString("bg-BG")} <span className="text-base font-bold text-slate-400">л.</span></p>
            <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Стойност: {totalCost.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">Допустими литри за акциз (ДФЗ)</span>
              <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">{eligibleLitres.toLocaleString("bg-BG")} <span className="text-base font-bold">л.</span></p>
            <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">100% първично селскостопанско производство</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-blue-500/40 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">Очаквано възстановяване (€)</span>
              <div className="rounded-xl bg-blue-500/15 p-2.5 text-blue-600 dark:text-blue-400">
                <Calculator size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-blue-600 dark:text-blue-400">+{estimatedRefundEur.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} €</p>
            <span className="mt-1 block text-xs font-bold text-blue-800 dark:text-blue-300">При ставка {refundRateEurPerLitre} €/литър (~0.41 лв)</span>
          </div>

          <div className="glass-panel-pro rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Пътни листи и ордери</span>
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
                <FileCheck size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{sheets.length} <span className="text-base font-bold text-slate-400">листа</span></p>
            <span className="mt-1 block text-xs font-bold text-emerald-600 dark:text-emerald-400">Всички норми са заложени по агро-стандарт</span>
          </div>
        </div>

        {/* DFZ Electronic Vouchers Hub */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-300">
              <Fuel size={14} />
              <span>ДФЗ • Електронни ваучери за газьол</span>
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Експорт за годишно заявление по схема за намален акциз</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              Модулът групира разхода на гориво по култури и операции и генерира файл, готов за директно качване в СЕУ (Система за електронни услуги) на ДФЗ и Агенция „Митници“.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowVouchersModal(true)}
              className="w-full md:w-auto rounded-2xl bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-4 text-sm font-extrabold text-white transition hover:scale-[1.03] shadow-md shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              <span>Генерирай файл за ДФЗ (СЕУ / Акциз)</span>
            </button>
          </div>
        </div>

        {/* Working Sheets Table section */}
        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Дневник на пътните и работните листи</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Отчетено гориво спрямо норматив за обработка на дка</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter size={14} /> Допустимост за акциз:
              </span>
              <select
                value={filterEligible}
                onChange={(e) => setFilterEligible(e.target.value)}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Всички записи ({sheets.length})</option>
                <option value="eligible">Допустими за акциз (Първично производство)</option>
                <option value="non-eligible">Недопустими (Транспорт / Администрация)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="pb-3.5">Дата & Лист №</th>
                  <th className="pb-3.5">Машина & Механизатор</th>
                  <th className="pb-3.5">Операция & Парцел</th>
                  <th className="pb-3.5 text-right">Норма (л/дка)</th>
                  <th className="pb-3.5 text-right font-black text-slate-900 dark:text-white">Изразходвано</th>
                  <th className="pb-3.5 text-right">Стойност (€)</th>
                  <th className="pb-3.5 text-center">Акцизен статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {filteredSheets.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4">
                      <div className="font-extrabold text-slate-900 dark:text-white font-mono">{row.sheetNumber}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{row.date}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{row.machineName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{row.operatorName}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200">{row.operationType}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{row.fieldIdAndArea}</div>
                    </td>
                    <td className="py-4 text-right font-mono text-slate-500 dark:text-slate-400">
                      {row.normLitresPerDka > 0 ? `${row.normLitresPerDka} л/дка` : "—"}
                    </td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-white text-base">
                      {row.totalLitresUsed} л.
                    </td>
                    <td className="py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                      {row.dieselCostEur.toFixed(2)} €
                    </td>
                    <td className="py-4 text-center">
                      {row.eligibleForExciseRefund ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 size={13} />
                          <span>Допустим (ДФЗ)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <AlertCircle size={13} />
                          <span>Общ разход (609)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal simulating DFZ export */}
        {showVouchersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="glass-panel-pro rounded-[32px] border border-blue-500/40 bg-white dark:bg-slate-900 p-8 max-w-xl w-full shadow-2xl space-y-6">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <div className="rounded-2xl bg-blue-500/15 p-3">
                  <Fuel size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Заявление за възстановяване на акциз на газьол
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Държавен фонд „Земеделие“ (СЕУ)</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-5 space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Земеделски производител:</span>
                  <strong className="text-slate-900 dark:text-white">АгриНексус Стопанство (УРН 104581)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Общо заявени допустими литри за периода:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{eligibleLitres} литра</strong>
                </div>
                <div className="flex justify-between">
                  <span>Нормативна ставка на отстъпка от акциза:</span>
                  <strong className="text-slate-900 dark:text-white">{refundRateEurPerLitre} €/л. (0.41 лв)</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm font-black">
                  <span>Очаквана стойност за възстановяване / ваучер:</span>
                  <span className="text-blue-600 dark:text-blue-400">+{estimatedRefundEur.toFixed(2)} €</span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Файлът съдържа опис на всички пътни листи, фактури за гориво и обработени площи съгласно изискванията на Наредба за държавна помощ „Помощ под формата на отстъпка от стойността на акциза върху газьола“.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowVouchersModal(false)}
                  className="rounded-2xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Затвори
                </button>
                <button
                  onClick={() => {
                    alert("Изтеглихте файл DFZ_Excise_Refund_2025.xml. Можете да го прикачите в СЕУ!");
                    setShowVouchersModal(false);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-blue-500/30 hover:scale-[1.02]"
                >
                  Изтегли XML за СЕУ (ДФЗ)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
