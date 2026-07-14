"use client";

import { useState } from "react";
import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Share2, 
  Download, 
  FileCode, 
  CheckCircle2, 
  Users, 
  Lock, 
  Mail, 
  Copy, 
  Sparkles,
  ShieldCheck,
  Building2,
  FileCheck2
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountingSoftware = "biznes_navigator" | "microinvest" | "ajur" | "plus_minus" | "workflow" | "sap";

const SOFTWARE_LIST: { id: AccountingSoftware; name: string; format: string; desc: string }[] = [
  { id: "biznes_navigator", name: "Бизнес Навигатор (БН)", format: "XML / BN-Data v9.4", desc: "Експорт на фактури за покупки и продажби, банкови извлечения и ДДС дневници." },
  { id: "microinvest", name: "Микроинвест Делта Про", format: "CSV / XML Exchange", desc: "Пълен импорт на първични счетоводни документи, клиенти, доставчици и касови ордери." },
  { id: "ajur", name: "АЖУР-L (Бонев Софт)", format: "TXT / XML Standard", desc: "Аналитично прехвърляне на сметки от група 60 (разходи) и група 70 (приходи)." },
  { id: "plus_minus", name: "Плюс Минус (ПМ)", format: "XML Schema 2025", desc: "Импорт на ведомости за заплати, рентни плащания и амортизационен план на ДМА." },
  { id: "workflow", name: "WorkFlow (АСП)", format: "JSON / API Bridge", desc: "Директна облачна синхронизация в реално време или експорт в структурен пакет." },
  { id: "sap", name: "SAP Business One / ERP", format: "IDoc / XML / CSV", desc: "Корпоративен експорт за големи агрохолдинги и кооперации с мулти-компани структура." },
];

export default function ExportPage() {
  const [selectedSoftware, setSelectedSoftware] = useState<AccountingSoftware>("biznes_navigator");
  const [selectedPeriod, setSelectedPeriod] = useState("m10-2025");
  const [includedDocs, setIncludedDocs] = useState({
    invoicesSales: true,
    invoicesPurchases: true,
    bankStatements: true,
    rentPayroll: true,
    warehouseMovements: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [guestAccessEnabled, setGuestAccessEnabled] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const activeInfo = SOFTWARE_LIST.find((s) => s.id === selectedSoftware) || SOFTWARE_LIST[0];

  const handleRunExport = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
    }, 1200);
  };

  const handleCopyGuestLink = () => {
    navigator.clipboard?.writeText("https://agrinexuslaw.com/portal/guest/acct-8841-az99-sec2026");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
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
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Мост със Счетоводна кантора и Експорт</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Сигурна обмяна • 100% Българска съвместимост</span>
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
              <Share2 size={14} />
              <span>Без хартия и кашони с фактури</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Интеграция с външен счетоводител и софтуерен експорт
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Край на ръчното въвеждане в счетоводната кантора. Генерирайте валиден файл за любимия софтуер на вашия счетоводител (Бизнес Навигатор, Микроинвест, Ажур и др.) или му дайте защитен портален достъп за директно изтегляне.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* Left 2 Cols: Export Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                  <span>1. Изберете счетоводната програма на вашата кантора</span>
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Всяка система използва специфична XML/CSV структура за автоматизирано осчетоводяване</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SOFTWARE_LIST.map((sw) => {
                  const isSelected = sw.id === selectedSoftware;
                  return (
                    <button
                      key={sw.id}
                      onClick={() => { setSelectedSoftware(sw.id); setExportSuccess(false); }}
                      className={cn(
                        "rounded-2xl p-4.5 border text-left transition-all duration-300 relative overflow-hidden",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-md scale-[1.02]"
                          : "border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-400/60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">{sw.name}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </div>
                      <span className="inline-block mt-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        {sw.format}
                      </span>
                      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">{sw.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span>2. Период и обхват на първичните документи</span>
                </h3>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Отчетен период:</span>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="m10-2025">Октомври 2025 г. (Текущ месец)</option>
                      <option value="q3-2025">3-то тримесечие / 2025 г.</option>
                      <option value="q4-2025">4-то тримесечие / 2025 г.</option>
                      <option value="y-2025">Цяла стопанска 2025 г. (Годишно приключване)</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includedDocs.invoicesSales}
                      onChange={(e) => setIncludedDocs({ ...includedDocs, invoicesSales: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Фактури за продажби (Зърно, мляко)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includedDocs.invoicesPurchases}
                      onChange={(e) => setIncludedDocs({ ...includedDocs, invoicesPurchases: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Фактури за покупки (Торове, горива)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includedDocs.bankStatements}
                      onChange={(e) => setIncludedDocs({ ...includedDocs, bankStatements: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Банкови извлечения и транзакции</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includedDocs.rentPayroll}
                      onChange={(e) => setIncludedDocs({ ...includedDocs, rentPayroll: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Рентни ведомости и ордери за рента</span>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Готов пакет: <strong className="text-slate-900 dark:text-white font-bold">{activeInfo.format}</strong> • Съвместим с НАП 2026
                </div>

                <button
                  type="button"
                  onClick={handleRunExport}
                  disabled={isExporting}
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 px-8 py-4 text-sm font-extrabold text-white shadow-md shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  <Download size={18} />
                  <span>{isExporting ? "Генериране на XML пакет..." : `Експортирай за ${activeInfo.name.split(" ")[0]}`}</span>
                </button>
              </div>

              {/* Success box */}
              {exportSuccess && (
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-5 flex items-start gap-3 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Успешно генериран експортен пакет!</h4>
                    <p className="font-medium leading-relaxed">
                      Файлът <strong className="font-mono underline">AgriNexus_Export_{activeInfo.id}_M10_2025.zip</strong> беше изтеглен на вашия компютър. Изпратете го на главния си счетоводител или го импортирайте директно в счетоводния софтуер от меню „Файл → Импорт на външни данни“.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: External Accountant Portal Bridge */}
          <div className="space-y-6">
            <div className="glass-panel-pro rounded-[32px] border border-fuchsia-500/40 bg-gradient-to-b from-white via-white to-fuchsia-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-fuchsia-950/30 p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-600 dark:text-fuchsia-400">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Портал за счетоводител</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Защитен достъп за външна кантора</p>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Вместо да пращате файлове по имейл, дайте на вашия счетоводител или одитор защитен линк с права само за четене и експорт на първични документи.
              </p>

              {/* Status toggle */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Статус на портала:</span>
                  <button
                    onClick={() => setGuestAccessEnabled(!guestAccessEnabled)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-extrabold transition",
                      guestAccessEnabled ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-400"
                    )}
                  >
                    {guestAccessEnabled ? "● Активен достъп" : "○ Изключен"}
                  </button>
                </div>

                {guestAccessEnabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="block text-[11px] font-bold uppercase text-slate-400">Защитен линк за вход на кантората</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://agrinexuslaw.com/portal/guest/acct-8841-az99"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                      />
                      <button
                        onClick={handleCopyGuestLink}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-extrabold text-white dark:bg-slate-100 dark:text-slate-900 transition flex items-center gap-1 shrink-0"
                      >
                        <Copy size={13} />
                        <span>{copySuccess ? "Копиран!" : "Копирай"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className="block text-xs font-black uppercase text-slate-400">Какво вижда счетоводителят?</span>
                <ul className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Всички издадени и получени фактури (PDF & XML)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Банкови извлечения по всички IBAN сметки</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Рентни ведомости и декларации за НАП</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <Lock size={14} />
                    <span>Няма право да променя агротехника или парцели</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </SitePageShell>
  );
}
