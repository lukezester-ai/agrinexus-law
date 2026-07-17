"use client";

import { useState } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Sprout, Download, FileCheck, AlertTriangle, CheckCircle2, FlaskConical, Award, RefreshCw, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PuhvPlot = {
  fieldNo: string;
  fieldName: string;
  areaDa: number;
  crop: string;
  expectedYield: number;
  soil: {
    sampleDate: string;
    labCert: string;
    n: number;
    p: number;
    k: number;
    pH: number;
    humus: number;
  };
  norms: { n: number; p: number; k: number };
  applied: { n: number; p: number; k: number };
};

const INITIAL_PLOTS: PuhvPlot[] = [
  {
    fieldNo: "BG-1042-001",
    fieldName: "Нива Слатина - Равнището",
    areaDa: 420.0,
    crop: "Пшеница (Хлебна)",
    expectedYield: 650,
    soil: { sampleDate: "14.10.2024", labCert: "ИПАЗР-№884/2024", n: 2.1, p: 4.8, k: 22.4, pH: 6.8, humus: 2.45 },
    norms: { n: 16.2, p: 7.8, k: 9.0 },
    applied: { n: 11.01, p: 4.5, k: 0.0 },
  },
  {
    fieldNo: "BG-1042-002",
    fieldName: "Масив Бреста - Горна нива",
    areaDa: 310.0,
    crop: "Царевица за зърно",
    expectedYield: 850,
    soil: { sampleDate: "18.10.2024", labCert: "ИПАЗР-№885/2024", n: 1.8, p: 3.5, k: 18.2, pH: 6.4, humus: 2.10 },
    norms: { n: 18.5, p: 8.5, k: 12.0 },
    applied: { n: 16.10, p: 6.0, k: 6.0 },
  },
  {
    fieldNo: "BG-1042-003",
    fieldName: "Лозя и Трайни насаждения",
    areaDa: 150.0,
    crop: "Лозя (Винен сорт Мерло)",
    expectedYield: 700,
    soil: { sampleDate: "02.11.2024", labCert: "ИПАЗР-№912/2024", n: 2.5, p: 6.2, k: 28.0, pH: 7.1, humus: 2.80 },
    norms: { n: 10.0, p: 6.0, k: 14.0 },
    applied: { n: 6.40, p: 5.0, k: 10.0 },
  },
];

export default function PuhvPage() {
  const [plots, setPlots] = useState<PuhvPlot[]>(INITIAL_PLOTS);
  const [selectedPlot, setSelectedPlot] = useState<PuhvPlot | null>(INITIAL_PLOTS[0]);
  const [activeNutrient, setActiveNutrient] = useState<"n" | "p" | "k">("n");
  const [agronomistName, setAgronomistName] = useState("инж-агрон. Димитър Стефанов");
  const [diplomaNo, setDiplomaNo] = useState("№ 14892 / АУ - Пловдив");
  const [babhCertNo, setBabhCertNo] = useState("№ 0148-AGR / БАБХ");
  const [showCertModal, setShowCertModal] = useState(false);

  const totalArea = plots.reduce((s, p) => s + p.areaDa, 0);
  const totalAppliedN = plots.reduce((s, p) => s + p.applied.n * p.areaDa, 0);
  const avgNPerDa = totalArea ? totalAppliedN / totalArea : 0;
  const allPlotsCompliant = plots.every((p) => p.applied.n <= 17.0);

  const downloadFile = (format: "xml" | "csv" | "certificate") => {
    window.open(`/api/farm/chemicals/puhv-export?format=${format}&year=2026`, "_blank");
  };

  return (
    <SitePageShell
      maxWidth="6xl"
      subheader={
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/moya-ferma/himizacia" className="hover:text-emerald-600 transition">Химизация и Торене</Link>
          <ChevronRight size={14} />
          <span className="text-emerald-700 dark:text-emerald-400">План за управление на хранителните вещества (ПУХВ • Еко-ЗВПП)</span>
        </div>
      }
    >
      {/* Top Banner & SEU Compliance Badge */}
      <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 via-emerald-800/10 to-transparent relative overflow-hidden shadow-md">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <Sprout size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Екосхема Еко-ЗВПП • чл. 38 от Наредба № 3/2023</span>
            </div>
            {allPlotsCompliant ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400" />
                <span>100% Спазен Лимит в Нитратни Зони (≤ 17 кг N/дка)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-800 dark:bg-red-900/60 dark:text-red-200">
                <AlertTriangle size={14} className="text-red-600" />
                <span>Внимание: Превишен Нитратен Праг</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            План за управление на хранителните вещества (ПУХВ 2026)
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Автоматичен баланс на Азот (N), Фосфор (P₂O₅) и Калий (K₂O) въз основа на почвени проби и планиран добив. Генерира задължителния файл за <strong>СЕУ на ДФЗ</strong> и официално <strong>Удостоверение от дипломиран агроном</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadFile("xml")}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-xs font-black shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
            >
              <Download size={15} />
              <span>📥 Експорт XML за СЕУ (ДФЗ)</span>
            </button>
            <button
              onClick={() => downloadFile("csv")}
              className="rounded-2xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 px-5 py-3 text-xs font-black transition flex items-center gap-2 shadow-sm"
            >
              <FileText size={15} />
              <span>Изтегли CSV / Excel таблица</span>
            </button>
            <button
              onClick={() => setShowCertModal(true)}
              className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-5 py-3 text-xs font-extrabold transition flex items-center gap-2"
            >
              <Award size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>📑 Удостоверение на Агронома (PDF/TXT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Обща Площ в Плана</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalArea.toFixed(1)} дка</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">Брой блокове: {plots.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Общо Внесен Чист Азот (N)</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalAppliedN.toFixed(1)} кг</p>
          <p className="text-xs font-bold text-slate-500 mt-1">От минерални & органични торове</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Средно N на Декар</p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgNPerDa.toFixed(2)} кг/дка</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Лимит в НУЗ: 17.0 кг N/дка</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Отговорен Агроном</p>
          <p className="mt-1 text-base font-black text-slate-900 dark:text-white truncate">{agronomistName}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{babhCertNo}</p>
        </div>
      </div>

      {/* Nutrient Switch & Interactive Balance Table */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="text-emerald-600" size={20} />
            <span>Баланс на Хранителните Вещества по Земеделски Блокове</span>
          </h2>

          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveNutrient("n")}
              className={cn("rounded-xl px-4 py-1.5 text-xs font-black transition", activeNutrient === "n" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300")}
            >
              ⚡ Азот (N)
            </button>
            <button
              onClick={() => setActiveNutrient("p")}
              className={cn("rounded-xl px-4 py-1.5 text-xs font-black transition", activeNutrient === "p" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300")}
            >
              🧪 Фосфор (P₂O₅)
            </button>
            <button
              onClick={() => setActiveNutrient("k")}
              className={cn("rounded-xl px-4 py-1.5 text-xs font-black transition", activeNutrient === "k" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300")}
            >
              💎 Калий (K₂O)
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Блок №</th>
                  <th className="p-3.5">Име на Парцел</th>
                  <th className="p-3.5 text-right">Площ</th>
                  <th className="p-3.5">Култура / Добив</th>
                  <th className="p-3.5 text-right">Почвен Анализ ({activeNutrient.toUpperCase()})</th>
                  <th className="p-3.5 text-right">Норма ({activeNutrient.toUpperCase()})</th>
                  <th className="p-3.5 text-right">Внесено ({activeNutrient.toUpperCase()})</th>
                  <th className="p-3.5 text-right">Баланс / Доторене</th>
                  <th className="p-3.5">Статус Еко-ЗВПП</th>
                  <th className="p-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {plots.map((p) => {
                  const normVal = activeNutrient === "n" ? p.norms.n : activeNutrient === "p" ? p.norms.p : p.norms.k;
                  const appliedVal = activeNutrient === "n" ? p.applied.n : activeNutrient === "p" ? p.applied.p : p.applied.k;
                  const soilVal = activeNutrient === "n" ? p.soil.n : activeNutrient === "p" ? p.soil.p : p.soil.k;
                  const balance = normVal - appliedVal;
                  const isCompliant = p.applied.n <= 17.0;

                  return (
                    <tr
                      key={p.fieldNo}
                      onClick={() => setSelectedPlot(p)}
                      className={cn(
                        "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition cursor-pointer",
                        selectedPlot?.fieldNo === p.fieldNo && "bg-emerald-50/70 dark:bg-emerald-950/40 font-bold"
                      )}
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{p.fieldNo}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{p.fieldName}</td>
                      <td className="p-3.5 text-right font-black text-slate-800 dark:text-slate-200">{p.areaDa} дка</td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 dark:text-white block">{p.crop}</span>
                        <span className="text-[11px] font-semibold text-slate-400">{p.expectedYield} кг/дка</span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {soilVal} mg/100g <span className="text-[10px] text-slate-400 block">(pH: {p.soil.pH})</span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-800 dark:text-slate-200">{normVal.toFixed(2)} кг/дка</td>
                      <td className="p-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{appliedVal.toFixed(2)} кг/дка</td>
                      <td className="p-3.5 text-right font-black">
                        {balance > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">+{balance.toFixed(2)} (Нужда)</span>
                        ) : balance < 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">{balance.toFixed(2)} (Излишък)</span>
                        ) : (
                          <span className="text-emerald-600">0.00 (Оптимално)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isCompliant ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <CheckCircle2 size={12} /> ≤ 17 кг N
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-800 dark:bg-red-900/60 dark:text-red-300">
                            <AlertTriangle size={12} /> Нарушение
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-slate-400">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Plot Detailed NPK Card */}
      {selectedPlot && (
        <div className="mt-6 glass-panel-pro rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Детайлен Агрохимичен Анализ & Препоръка • {selectedPlot.fieldNo}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{selectedPlot.fieldName} ({selectedPlot.areaDa} дка)</h3>
            </div>
            <div className="text-right text-xs font-bold text-slate-500">
              <span>Проба от: {selectedPlot.soil.sampleDate}</span>
              <span className="block font-mono text-slate-400">Лаб. Сертификат: {selectedPlot.soil.labCert}</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 p-5 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">
                <span>⚡ Азот (N)</span>
                <span className="font-mono">{selectedPlot.soil.n} mg/100g</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Норма за добив {selectedPlot.expectedYield} кг:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedPlot.norms.n.toFixed(2)} кг/дка</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Внесено от торене:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{selectedPlot.applied.n.toFixed(2)} кг/дка</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800/50 font-bold">
                  <span>Препоръка за доторене:</span>
                  <strong className={selectedPlot.norms.n - selectedPlot.applied.n > 0 ? "text-blue-600" : "text-emerald-600"}>
                    {selectedPlot.norms.n - selectedPlot.applied.n > 0 ? `+${(selectedPlot.norms.n - selectedPlot.applied.n).toFixed(2)} кг N/дка` : "Оптимално"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 p-5 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-blue-800 dark:text-blue-300 uppercase">
                <span>🧪 Фосфор (P₂O₅)</span>
                <span className="font-mono">{selectedPlot.soil.p} mg/100g</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Норма за добив {selectedPlot.expectedYield} кг:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedPlot.norms.p.toFixed(2)} кг/дка</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Внесено от торене:</span>
                  <strong className="text-blue-600 dark:text-blue-400">{selectedPlot.applied.p.toFixed(2)} кг/дка</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-200 dark:border-blue-800/50 font-bold">
                  <span>Препоръка за доторене:</span>
                  <strong className={selectedPlot.norms.p - selectedPlot.applied.p > 0 ? "text-blue-600" : "text-emerald-600"}>
                    {selectedPlot.norms.p - selectedPlot.applied.p > 0 ? `+${(selectedPlot.norms.p - selectedPlot.applied.p).toFixed(2)} кг P/дка` : "Оптимално"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 p-5 border border-purple-200 dark:border-purple-900/50 space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-purple-800 dark:text-purple-300 uppercase">
                <span>💎 Калий (K₂O)</span>
                <span className="font-mono">{selectedPlot.soil.k} mg/100g</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Норма за добив {selectedPlot.expectedYield} кг:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedPlot.norms.k.toFixed(2)} кг/дка</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Внесено от торене:</span>
                  <strong className="text-purple-600 dark:text-purple-400">{selectedPlot.applied.k.toFixed(2)} кг/дка</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-purple-200 dark:border-purple-800/50 font-bold">
                  <span>Препоръка за доторене:</span>
                  <strong className={selectedPlot.norms.k - selectedPlot.applied.k > 0 ? "text-blue-600" : "text-emerald-600"}>
                    {selectedPlot.norms.k - selectedPlot.applied.k > 0 ? `+${(selectedPlot.norms.k - selectedPlot.applied.k).toFixed(2)} кг K/дка` : "Оптимално"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agronomist Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                <Award className="text-emerald-600" size={22} />
                <span>Официално Удостоверение от Дипломиран Агроном</span>
              </div>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Дипломиран Агроном (Име и Фамилия)</label>
                  <input
                    value={agronomistName}
                    onChange={(e) => setAgronomistName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Диплома № / Университет</label>
                  <input
                    value={diplomaNo}
                    onChange={(e) => setDiplomaNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Удостоверение от БАБХ № (Растителна защита и торене)</label>
                <input
                  value={babhCertNo}
                  onChange={(e) => setBabhCertNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-extrabold text-emerald-800 dark:text-emerald-300">ДЕКЛАРАЦИЯ ЗА СЪОТВЕТСТВИЕ ПО ЕКО-ЗВПП:</p>
                <p>
                  Долуподписаният <strong>{agronomistName}</strong> удостоверявам, че настоящият План за управление на хранителните вещества (ПУХВ) е изготвен съгласно изискванията на чл. 38 от Наредба № 3/2023 г. за условията и реда за прилагане на интервенциите под формата на директни плащания и спазва лимитите от Наредба № 2 за защита на водите от замърсяване с нитрати (максимум 17 кг N/дка в НУЗ).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCertModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Затвори
              </button>
              <button
                onClick={() => {
                  downloadFile("certificate");
                  setShowCertModal(false);
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-black shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Изтегли Подписано Удостоверение (TXT)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
