"use client";

import { useState } from "react";
import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Sprout, 
  PieChart, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  Sliders,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type CropCostData = {
  id: string;
  cropName: string;
  fieldAreaDka: number;
  expectedYieldKgPerDka: number;
  marketPriceEurPerTon: number;
  costs: {
    seeds: number;
    fertilizersAndChemicals: number;
    fuelAndMachinery: number;
    laborAndInsurance: number;
    landLeaseRent: number;
    depreciationAndOverhead: number;
  };
  status: "growing" | "harvested";
};

const INITIAL_CROPS: CropCostData[] = [
  {
    id: "wheat-2026",
    cropName: "Пшеница (Зимна - Енола)",
    fieldAreaDka: 2400,
    expectedYieldKgPerDka: 620,
    marketPriceEurPerTon: 215,
    costs: {
      seeds: 18,
      fertilizersAndChemicals: 48,
      fuelAndMachinery: 32,
      laborAndInsurance: 15,
      landLeaseRent: 65,
      depreciationAndOverhead: 22,
    },
    status: "growing",
  },
  {
    id: "corn-2026",
    cropName: "Царевица за зърно (Pioneer P9241)",
    fieldAreaDka: 1800,
    expectedYieldKgPerDka: 850,
    marketPriceEurPerTon: 195,
    costs: {
      seeds: 35,
      fertilizersAndChemicals: 62,
      fuelAndMachinery: 45,
      laborAndInsurance: 18,
      landLeaseRent: 65,
      depreciationAndOverhead: 25,
    },
    status: "growing",
  },
  {
    id: "sunflower-2026",
    cropName: "Слънчоглед (Маслодаен - Syngenta)",
    fieldAreaDka: 1500,
    expectedYieldKgPerDka: 310,
    marketPriceEurPerTon: 420,
    costs: {
      seeds: 28,
      fertilizersAndChemicals: 42,
      fuelAndMachinery: 28,
      laborAndInsurance: 14,
      landLeaseRent: 65,
      depreciationAndOverhead: 20,
    },
    status: "growing",
  },
  {
    id: "rapeseed-2026",
    cropName: "Зимна рапица (DK Exstorm)",
    fieldAreaDka: 800,
    expectedYieldKgPerDka: 380,
    marketPriceEurPerTon: 460,
    costs: {
      seeds: 24,
      fertilizersAndChemicals: 55,
      fuelAndMachinery: 36,
      laborAndInsurance: 16,
      landLeaseRent: 65,
      depreciationAndOverhead: 24,
    },
    status: "harvested",
  },
];

export default function SebestoynostPage() {
  const [crops] = useState<CropCostData[]>(INITIAL_CROPS);
  const [selectedCropId, setSelectedCropId] = useState<string>("wheat-2026");
  const [simulatedYield, setSimulatedYield] = useState<number | null>(null);
  const [simulatedPrice, setSimulatedPrice] = useState<number | null>(null);
  const [isTransferred, setIsTransferred] = useState<Record<string, boolean>>({ "rapeseed-2026": true });

  const activeCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  const totalCostPerDka = Object.values(activeCrop.costs).reduce((a, b) => a + b, 0);
  const totalArea = activeCrop.fieldAreaDka;
  const totalCostOverall = totalCostPerDka * totalArea;

  const currentYield = simulatedYield ?? activeCrop.expectedYieldKgPerDka;
  const currentPriceTon = simulatedPrice ?? activeCrop.marketPriceEurPerTon;

  const costPerKg = currentYield > 0 ? totalCostPerDka / currentYield : 0;
  const costPerTon = costPerKg * 1000;

  const revenuePerDka = (currentYield / 1000) * currentPriceTon;
  const profitPerDka = revenuePerDka - totalCostPerDka;
  const profitMarginPercent = revenuePerDka > 0 ? (profitPerDka / revenuePerDka) * 100 : 0;

  const handleResetSimulation = () => {
    setSimulatedYield(null);
    setSimulatedPrice(null);
  };

  const handleTransferToFinishedGoods = (cropId: string) => {
    setIsTransferred((prev) => ({ ...prev, [cropId]: true }));
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
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Аналитична себестойност (НСС 41 / МСС 41)</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Алокация на преки и косвени разходи по култури</span>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
              <Sprout size={14} />
              <span>Земеделско счетоводство по стандарти</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Калкулатор за себестойност на дка и тон продукция
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Разберете с точност до евроцент колко ви струва отглеждането на всяка култура. Модулът автоматично събира разходите за семена, торове, гориво, рента и амортизации и калкулира точката на зануляване (Break-even Point) спрямо борсовите цени.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pb-2">
          {crops.map((crop) => {
            const isSelected = crop.id === selectedCropId;
            const isTrans = Boolean(isTransferred[crop.id]);
            return (
              <button
                key={crop.id}
                onClick={() => {
                  setSelectedCropId(crop.id);
                  handleResetSimulation();
                }}
                className={cn(
                  "rounded-2xl px-5 py-3 text-sm font-extrabold transition-all duration-300 flex items-center gap-2.5 shadow-sm",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]"
                    : "glass-panel border border-slate-200/80 bg-white/90 text-slate-700 hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300"
                )}
              >
                <Sprout size={16} className={isSelected ? "text-white" : "text-emerald-600 dark:text-emerald-400"} />
                <span>{crop.cropName}</span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                  isTrans 
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200" 
                    : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                )}>
                  {isTrans ? "Сметка 303 (Готова)" : "Сметка 6111 (Расте)"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart size={20} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Структура на себестойността</span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Площ на масива: <strong className="text-slate-900 dark:text-white font-bold">{activeCrop.fieldAreaDka} дка</strong> • Общи направени разходи: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{totalCostOverall.toLocaleString("bg-BG")} €</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xs uppercase font-extrabold text-slate-400 dark:text-slate-500">Общо на дка</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {totalCostPerDka.toFixed(2)} €<span className="text-sm font-bold text-slate-400">/дка</span>
                  </span>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <tr>
                      <th className="pb-3.5">Елемент на разхода (Счетоводна сметка)</th>
                      <th className="pb-3.5 text-right">Разход на Дка (€)</th>
                      <th className="pb-3.5 text-right">Общо за масива (€)</th>
                      <th className="pb-3.5 text-right">Дял (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Семена и посаден материал (Сметка 6011)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">{activeCrop.costs.seeds.toFixed(2)} €</td>
                      <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{(activeCrop.costs.seeds * totalArea).toLocaleString("bg-BG")} €</td>
                      <td className="py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{((activeCrop.costs.seeds / totalCostPerDka) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                        <span>Минерални торове и препарати ХЗР (Сметка 6012)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">{activeCrop.costs.fertilizersAndChemicals.toFixed(2)} €</td>
                      <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{(activeCrop.costs.fertilizersAndChemicals * totalArea).toLocaleString("bg-BG")} €</td>
                      <td className="py-3.5 text-right font-bold text-teal-600 dark:text-teal-400">{((activeCrop.costs.fertilizersAndChemicals / totalCostPerDka) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                        <span>Гориво, смазочни материали и ГСМ (Сметка 6013)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">{activeCrop.costs.fuelAndMachinery.toFixed(2)} €</td>
                      <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{(activeCrop.costs.fuelAndMachinery * totalArea).toLocaleString("bg-BG")} €</td>
                      <td className="py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">{((activeCrop.costs.fuelAndMachinery / totalCostPerDka) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                        <span>Заплати, осигуровки и механизатори (Сметки 604 & 605)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">{activeCrop.costs.laborAndInsurance.toFixed(2)} €</td>
                      <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{(activeCrop.costs.laborAndInsurance * totalArea).toLocaleString("bg-BG")} €</td>
                      <td className="py-3.5 text-right font-bold text-purple-600 dark:text-purple-400">{((activeCrop.costs.laborAndInsurance / totalCostPerDka) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shrink-0" />
                        <span>Арендни вноски и ренти за земя (Сметка 602 / 499)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">{activeCrop.costs.landLeaseRent.toFixed(2)} €</td>
                      <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{(activeCrop.costs.landLeaseRent * totalArea).toLocaleString("bg-BG")} €</td>
                      <td className="py-3.5 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">{((activeCrop.costs.landLeaseRent / totalCostPerDka) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Амортизации на ДМА и общи разходи (Сметки 603 & 609)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900 dark:text-white">{activeCrop.costs.depreciationAndOverhead.toFixed(2)} €</td>
                      <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{(activeCrop.costs.depreciationAndOverhead * totalArea).toLocaleString("bg-BG")} €</td>
                      <td className="py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">{((activeCrop.costs.depreciationAndOverhead / totalCostPerDka) * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Визуална пропорция на разходите</span>
                <div className="w-full h-4 rounded-full flex overflow-hidden bg-slate-100 dark:bg-slate-800 gap-0.5">
                  <div style={{ width: `${(activeCrop.costs.seeds / totalCostPerDka) * 100}%` }} className="bg-emerald-500 h-full transition-all" title="Семена" />
                  <div style={{ width: `${(activeCrop.costs.fertilizersAndChemicals / totalCostPerDka) * 100}%` }} className="bg-teal-500 h-full transition-all" title="Торове и ХЗР" />
                  <div style={{ width: `${(activeCrop.costs.fuelAndMachinery / totalCostPerDka) * 100}%` }} className="bg-blue-500 h-full transition-all" title="Гориво" />
                  <div style={{ width: `${(activeCrop.costs.laborAndInsurance / totalCostPerDka) * 100}%` }} className="bg-purple-500 h-full transition-all" title="Заплати" />
                  <div style={{ width: `${(activeCrop.costs.landLeaseRent / totalCostPerDka) * 100}%` }} className="bg-fuchsia-500 h-full transition-all" title="Рента" />
                  <div style={{ width: `${(activeCrop.costs.depreciationAndOverhead / totalCostPerDka) * 100}%` }} className="bg-amber-500 h-full transition-all" title="Амортизации" />
                </div>
              </div>
            </div>

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-emerald-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                  <HelpCircle size={14} />
                  <span>Счетоводна операция по НСС 41</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Приключване на незавършено производство към готова продукция
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  При прибиране на реколтата натрупаните разходи по <strong>Сметка 6111 „Разходи за растителност“</strong> се кредитират в кореспонденция с дебита на <strong>Сметка 303 „Продукция от растителност“</strong> по аналитичната калкулирана себестойност от <strong>{costPerTon.toFixed(2)} €/тон</strong>.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {isTransferred[activeCrop.id] ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3.5 text-center text-sm font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    <span>Осчетоводено в Сметка 303</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTransferToFinishedGoods(activeCrop.id)}
                    className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 px-6 py-4 text-sm font-extrabold text-white shadow-md shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                  >
                    Приключи в Сметка 303 (Готова продукция)
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-gradient-to-b from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Симулатор на рентабилност</span>
                </h3>
                {(simulatedYield !== null || simulatedPrice !== null) && (
                  <button
                    onClick={handleResetSimulation}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>Нулирай</span>
                  </button>
                )}
              </div>

              <div className="space-y-5 py-5 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-extrabold mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Прогнозен добив (кг/дка):</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{currentYield} кг/дка</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1200"
                    step="10"
                    value={currentYield}
                    onChange={(e) => setSimulatedYield(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>150 кг</span>
                    <span>500 кг</span>
                    <span>1200 кг</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-extrabold mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Борсова изкупна цена (€/тон):</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{currentPriceTon} €/тон</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="700"
                    step="5"
                    value={currentPriceTon}
                    onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>100 €</span>
                    <span>350 €</span>
                    <span>700 €</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 space-y-4">
                <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-4 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">Калкулирана себестойност на 1 тон</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">{costPerTon.toFixed(2)} €<span className="text-xs font-bold text-slate-400">/тон</span></span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">На 1 кг</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{costPerKg.toFixed(3)} €</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-4 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">Приход от 1 дка (при {currentYield} кг)</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{revenuePerDka.toFixed(2)} €<span className="text-xs font-bold text-slate-400">/дка</span></span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">Разход на дка</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{totalCostPerDka.toFixed(2)} €</span>
                  </div>
                </div>

                <div className={cn(
                  "rounded-2xl p-5 border shadow-sm transition-all",
                  profitPerDka >= 0 
                    ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/50" 
                    : "bg-gradient-to-r from-rose-500/15 via-red-500/10 to-transparent border-rose-500/50"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {profitPerDka >= 0 ? "Очаквана чиста печалба" : "Очаквана загуба"}
                    </span>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-extrabold",
                      profitPerDka >= 0 ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" : "bg-rose-500/20 text-rose-800 dark:text-rose-300"
                    )}>
                      Марж: {profitMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={cn(
                      "text-3xl font-black",
                      profitPerDka >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {profitPerDka >= 0 ? "+" : ""}{profitPerDka.toFixed(2)} €<span className="text-xs font-bold text-slate-500">/дка</span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                      Общо: {(profitPerDka * totalArea).toLocaleString("bg-BG")} €
                    </span>
                  </div>
                  <p className="mt-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                    {profitPerDka >= 0 
                      ? `При борсова цена от ${currentPriceTon} €/тон и добив от ${currentYield} кг/дка масивът генерира положително парично течение.`
                      : `Внимание: При тази изкупна цена и добив продажбата е под себестойност от ${costPerTon.toFixed(2)} €/т.`}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-center">
                <Link
                  href="/moya-ferma/schetovodstvo/export"
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Експортирай калкулацията за счетоводна кантора</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </SitePageShell>
  );
}
