"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Shield, 
  Plus, 
  Save, 
  Trash2, 
  Loader2, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  CloudLightning,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type Policy = {
  id: string; 
  policyNumber: string; 
  type: string; 
  insurerName: string; 
  brokerName: string | null;
  insuredEntityType: string | null; 
  insuredEntityId: string | null; 
  insuredItemName: string | null;
  startDate: string; 
  endDate: string;
  premiumAmount: number; 
  coverageAmount: number; 
  deductible: number | null;
  status: string; 
  notes: string | null;
};

type ClaimItem = {
  id: string; 
  policyId: string; 
  claimNumber: string; 
  claimDate: string;
  description: string; 
  amountClaimed: number; 
  amountSettled: number | null;
  status: string; 
  notes: string | null;
  policyNumber?: string;
  insurerName?: string;
};

const INSURANCE_TYPES: Record<string, string> = {
  crop: "Земеделска реколта (Градушка, Буря, Измръзване)",
  machine: "Агротехника и Трактори (Каско & Гражданска)",
  property: "Сгради, Силози и Навеси",
  liability: "Обща земеделска отговорност",
  other: "Друга застраховка",
};

const DEMO_POLICIES: Policy[] = [
  {
    id: "pol-1",
    policyNumber: "РЕК-2025-88412",
    type: "crop",
    insurerName: "ДЗИ Общо застраховане ЕАД",
    brokerName: "Агро Брокер ООД",
    insuredEntityType: "crop",
    insuredEntityId: null,
    insuredItemName: "Пшеница 420 дка и Царевица 310 дка",
    startDate: "2025-03-01",
    endDate: "2025-10-31",
    premiumAmount: 14200,
    coverageAmount: 380000,
    deductible: 5,
    status: "active",
    notes: "Покрива риск Градушка, Проливен дъжд, Буря и Пожар на корен"
  },
  {
    id: "pol-2",
    policyNumber: "КАСКО-2025-0199",
    type: "machine",
    insurerName: "ЗЕАД Булстрад Виена Иншуранс Груп",
    brokerName: "Агро Брокер ООД",
    insuredEntityType: "machine",
    insuredEntityId: null,
    insuredItemName: "Трактор John Deere 8R 340 & Комбайн Claas Lexion",
    startDate: "2025-01-15",
    endDate: "2026-01-14",
    premiumAmount: 9600,
    coverageAmount: 490000,
    deductible: 0,
    status: "active",
    notes: "Пълен агро пакет включително пожар в полето и счупване на стъкла"
  }
];

const DEMO_CLAIMS: ClaimItem[] = [
  {
    id: "cl-1",
    policyId: "pol-1",
    claimNumber: "ЩЕТА-ГРАД-2025/06",
    claimDate: "2025-06-14",
    description: "Унищожена пшеница на корен от градушка (180 дка м. Равнището - 75% щета)",
    amountClaimed: 48000,
    amountSettled: 42500,
    status: "paid",
    notes: "Изплатена по Сметка 709 с преводно известие от 28.06.2025",
    policyNumber: "РЕК-2025-88412",
    insurerName: "ДЗИ Общо застраховане ЕАД"
  },
  {
    id: "cl-2",
    policyId: "pol-2",
    claimNumber: "ЩЕТА-ТЕХ-2025/08",
    claimDate: "2025-08-02",
    description: "Повредено предно челно стъкло и фар на трактор при жътва",
    amountClaimed: 3400,
    amountSettled: null,
    status: "approved",
    notes: "Очаква се изплащане от Булстрад до 15 дни",
    policyNumber: "КАСКО-2025-0199",
    insurerName: "ЗЕАД Булстрад"
  }
];

export default function ZastrahovkiPage() {
  const [activeTab, setActiveTab] = useState<"policies" | "claims" | "accounting_bridge">("policies");
  const [policies, setPolicies] = useState<Policy[]>(DEMO_POLICIES);
  const [claims, setClaims] = useState<ClaimItem[]>(DEMO_CLAIMS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPolForm, setShowPolForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  // Policy form
  const [polForm, setPolForm] = useState({
    policyNumber: "",
    type: "crop",
    insurerName: "ДЗИ Общо застраховане ЕАД",
    insuredItemName: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 31536000000).toISOString().split("T")[0],
    premiumAmount: 0,
    coverageAmount: 0,
    deductible: 5,
    notes: ""
  });

  // Claim form
  const [claimForm, setClaimForm] = useState({
    policyId: DEMO_POLICIES[0].id,
    claimNumber: "",
    claimDate: new Date().toISOString().split("T")[0],
    description: "",
    amountClaimed: 0,
    notes: ""
  });

  // Accounting Bridge Memo state
  const [memoGenerated, setMemoGenerated] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [polRes, clRes] = await Promise.all([
        fetch("/api/farm/insurance/policies"),
        fetch("/api/farm/insurance/claims")
      ]);
      if (polRes.ok) {
        const p = await polRes.json();
        if (Array.isArray(p) && p.length > 0) setPolicies(p);
      }
      if (clRes.ok) {
        const c = await clRes.json();
        if (Array.isArray(c) && c.length > 0) {
          setClaims(c.map((item: any) => ({
            id: item.claim?.id || item.id,
            policyId: item.claim?.policyId || item.policyId,
            claimNumber: item.claim?.claimNumber || item.claimNumber,
            claimDate: item.claim?.claimDate || item.claimDate,
            description: item.claim?.description || item.description,
            amountClaimed: item.claim?.amountClaimed || item.amountClaimed,
            amountSettled: item.claim?.amountSettled || item.amountSettled,
            status: item.claim?.status || item.status,
            notes: item.claim?.notes || item.notes,
            policyNumber: item.policyNumber || "ПОЛИЦА-01",
            insurerName: item.insurerName || "ДЗИ"
          })));
        }
      }
    } catch {
      // Keep demo data
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/insurance/policies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(polForm),
      });
      setPolicies(prev => [{
        ...polForm,
        id: `pol-${Date.now()}`,
        brokerName: "Агро Брокер ООД",
        insuredEntityType: polForm.type,
        insuredEntityId: null,
        status: "active",
        notes: polForm.notes || null
      }, ...prev]);
      setShowPolForm(false);
    } finally { setSaving(false); }
  };

  const handleSaveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/insurance/claims", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimForm),
      });
      const pol = policies.find(p => p.id === claimForm.policyId) || policies[0];
      setClaims(prev => [{
        id: `cl-${Date.now()}`,
        ...claimForm,
        amountSettled: null,
        status: "filed",
        notes: claimForm.notes || null,
        policyNumber: pol.policyNumber,
        insurerName: pol.insurerName
      }, ...prev]);
      setShowClaimForm(false);
    } finally { setSaving(false); }
  };

  const handleClaimStatusChange = async (id: string, st: string) => {
    try {
      let settled = null;
      if (st === "paid" || st === "approved") {
        const c = claims.find(item => item.id === id);
        settled = c ? c.amountClaimed * 0.9 : 40000;
      }
      await fetch("/api/farm/insurance/claims", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: st, amountSettled: settled }),
      });
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status: st, amountSettled: settled || c.amountSettled } : c));
    } catch {
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status: st } : c));
    }
  };

  const handleDeleteClaim = async (id: string) => {
    await fetch(`/api/farm/insurance/claims?id=${id}`, { method: "DELETE" });
    setClaims(claims.filter(c => c.id !== id));
  };

  const totalCoverage = policies.filter(p => p.status === "active").reduce((sum, p) => sum + Number(p.coverageAmount), 0);
  const totalPremiums = policies.filter(p => p.status === "active").reduce((sum, p) => sum + Number(p.premiumAmount), 0);
  const totalClaimed = claims.reduce((sum, c) => sum + Number(c.amountClaimed), 0);
  const totalSettled = claims.reduce((sum, c) => sum + Number(c.amountSettled || 0), 0);

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Земеделско застраховане, Щети & Обезщетения</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              Сметки 603 / 691 / 709 • НСС 2
            </span>
          </div>

          <div className="flex flex-wrap rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            <button
              onClick={() => setActiveTab("policies")}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "policies"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Shield size={14} />
              <span>Полици ({policies.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "claims"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <CloudLightning size={14} className="text-amber-500" />
              <span>Регистър Щети ({claims.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("accounting_bridge"); setMemoGenerated(false); }}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "accounting_bridge"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <BookOpen size={14} className={activeTab === "accounting_bridge" ? "text-white" : "text-emerald-500"} />
              <span>Счетоводен мост (Сметки 691 & 709)</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {activeTab === "policies" && (
          <>
            {/* Banner Hero */}
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <Shield size={14} />
                  <span>Агро застрахователна защита и премии</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Застрахователни полици за Земеделска Реколта и Техника
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Управление на полици за защита от природни бедствия (градушка, буря, измръзване) и агротехника (Каско). Застрахователните премии се отчитат по <strong>Сметка 603 (Разходи за застраховки)</strong> или разсрочено по <strong>Сметка 651 (Разходи за бъдещи периоди)</strong>.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Общо застрахователно покритие</span>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {totalCoverage.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв
                </p>
                <span className="mt-1 block text-xs font-bold text-slate-500">Защитени реколти и машини</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Годишни застрахователни премии</span>
                <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                  {totalPremiums.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв
                </p>
                <span className="mt-1 block text-xs font-bold text-slate-500">Разход по Сметка 603 / 651</span>
              </div>

              <div className="glass-panel-pro rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/95 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Активни договори</span>
                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {policies.filter(p => p.status === "active").length} полици
                </p>
                <span className="mt-1 block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Пълна защита през кампанията</span>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowPolForm(!showPolForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <Plus size={16} />
                <span>{showPolForm ? "Скрий формата" : "Въведи нова застрахователна полица"}</span>
              </button>
            </div>

            {/* Form */}
            {showPolForm && (
              <form onSubmit={handleSavePolicy} className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield size={18} className="text-emerald-600" />
                    <span>Регистрация на застрахователна полица</span>
                  </h3>
                  <button type="button" onClick={() => setShowPolForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Номер на полица</label>
                    <input value={polForm.policyNumber} onChange={(e) => setPolForm({ ...polForm, policyNumber: e.target.value })} required placeholder="напр. РЕК-2025-9921" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Застрахователна компания</label>
                    <input value={polForm.insurerName} onChange={(e) => setPolForm({ ...polForm, insurerName: e.target.value })} required placeholder="ДЗИ / Булстрад / Алианц" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип застраховка</label>
                    <select value={polForm.type} onChange={(e) => setPolForm({ ...polForm, type: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="crop">Земеделска реколта (Градушка, Буря, Измръзване)</option>
                      <option value="machine">Агротехника и Трактори (Каско)</option>
                      <option value="property">Земеделски сгради и Силози</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Застрахован обект (Парцели / Машини)</label>
                    <input value={polForm.insuredItemName} onChange={(e) => setPolForm({ ...polForm, insuredItemName: e.target.value })} required placeholder="напр. Пшеница 420 дка в землище Слатина" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Годишна застрахователна премия (лв)</label>
                    <input type="number" step="0.01" value={polForm.premiumAmount || ""} onChange={(e) => setPolForm({ ...polForm, premiumAmount: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Застрахователна сума (Покритие в лв)</label>
                    <input type="number" step="0.01" value={polForm.coverageAmount || ""} onChange={(e) => setPolForm({ ...polForm, coverageAmount: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Начало на покритието</label>
                    <input type="date" value={polForm.startDate} onChange={(e) => setPolForm({ ...polForm, startDate: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Край на покритието</label>
                    <input type="date" value={polForm.endDate} onChange={(e) => setPolForm({ ...polForm, endDate: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowPolForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition">Заведи полицата</button>
                </div>
              </form>
            )}

            {/* Table */}
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Полица №</th>
                      <th className="p-4">Застраховател</th>
                      <th className="p-4">Тип & Застрахован обект</th>
                      <th className="p-4 text-right">Застрах. премия (603)</th>
                      <th className="p-4 text-right">Покритие (лв)</th>
                      <th className="p-4">Период</th>
                      <th className="p-4 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {policies.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-xs font-extrabold text-slate-900 dark:text-white">{p.policyNumber}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{p.insurerName}</td>
                        <td className="p-4">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">{INSURANCE_TYPES[p.type] || p.type}</span>
                          <span className="text-xs text-slate-500 font-medium">{p.insuredItemName}</span>
                        </td>
                        <td className="p-4 text-right font-black text-amber-600 dark:text-amber-400">{Number(p.premiumAmount).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white">{Number(p.coverageAmount).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</td>
                        <td className="p-4 text-xs font-mono text-slate-500">{new Date(p.startDate).toLocaleDateString("bg-BG")} — {new Date(p.endDate).toLocaleDateString("bg-BG")}</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                            ● Активна
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "claims" && (
          <>
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/20 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
                  <CloudLightning size={14} />
                  <span>Регистър Градушки, Бури и Аварии</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Заявени щети и проследяване на изплатените обезщетения
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Всяка заявена щета се отчита съгласно НСС 2 и МСС 41. Отписването на повредената продукция минава през <strong>Сметка 691 (Извънредни разходи)</strong>, а полученото застрахователно обезщетение — през <strong>Сметка 709 (Други приходи)</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm font-bold text-slate-500">
                Общо претендирани щети: <strong className="text-rose-600 font-mono text-base">{totalClaimed.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</strong> • Изплатени: <strong className="text-emerald-600 font-mono text-base">{totalSettled.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</strong>
              </div>

              <button
                onClick={() => setShowClaimForm(!showClaimForm)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <Plus size={16} />
                <span>{showClaimForm ? "Скрий формата" : "Регистрирай нова щета (Градушка/Авария)"}</span>
              </button>
            </div>

            {showClaimForm && (
              <form onSubmit={handleSaveClaim} className="glass-panel-pro rounded-[32px] border border-amber-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CloudLightning size={18} className="text-amber-600" />
                    <span>Заявление за застрахователна щета</span>
                  </h3>
                  <button type="button" onClick={() => setShowClaimForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Към полица</label>
                    <select value={claimForm.policyId} onChange={(e) => setClaimForm({ ...claimForm, policyId: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500">
                      {policies.map(p => <option key={p.id} value={p.id}>{p.policyNumber} ({p.insurerName})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Номер на щета / преписка</label>
                    <input value={claimForm.claimNumber} onChange={(e) => setClaimForm({ ...claimForm, claimNumber: e.target.value })} required placeholder="напр. ЩЕТА-ГРАД-2025/11" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дата на събитието (Градушка/Буря)</label>
                    <input type="date" value={claimForm.claimDate} onChange={(e) => setClaimForm({ ...claimForm, claimDate: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Описание на увредената реколта / машина</label>
                    <input value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} required placeholder="напр. 100% унищожена пшеница на корен на площ 180 дка след градушка" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Претендирана сума (Оценка на щетата в лв)</label>
                    <input type="number" step="0.01" value={claimForm.amountClaimed || ""} onChange={(e) => setClaimForm({ ...claimForm, amountClaimed: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowClaimForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-amber-600 hover:bg-amber-700 px-6 py-2.5 text-xs font-black text-white transition">Заведи в регистъра</button>
                </div>
              </form>
            )}

            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Номер на щета</th>
                      <th className="p-4">Полица & Застраховател</th>
                      <th className="p-4">Дата на бедствие</th>
                      <th className="p-4">Описание на щетата</th>
                      <th className="p-4 text-right">Претендирано (691)</th>
                      <th className="p-4 text-right">Изплатено (709)</th>
                      <th className="p-4 text-center">Статус</th>
                      <th className="p-4 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {claims.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-xs font-extrabold text-slate-900 dark:text-white">{c.claimNumber}</td>
                        <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-400">{c.policyNumber}<br /><span className="text-slate-400 font-normal">{c.insurerName}</span></td>
                        <td className="p-4 font-mono text-xs text-slate-500">{new Date(c.claimDate).toLocaleDateString("bg-BG")}</td>
                        <td className="p-4 text-xs max-w-xs">{c.description}</td>
                        <td className="p-4 text-right font-black text-rose-600 dark:text-rose-400">{Number(c.amountClaimed).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</td>
                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">{c.amountSettled ? `${Number(c.amountSettled).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв` : "—"}</td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black",
                            c.status === "paid" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30" :
                            c.status === "approved" ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30" :
                            "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          )}>
                            {c.status === "paid" ? "● Платена в 709" : c.status === "approved" ? "◐ Одобрена" : "○ Подадена"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {c.status !== "paid" && (
                              <button onClick={() => handleClaimStatusChange(c.id, "paid")} className="rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-bold transition">
                                Изплати
                              </button>
                            )}
                            <button onClick={() => handleDeleteClaim(c.id)} className="rounded-xl p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "accounting_bridge" && (
          /* TAB 3: Accounting Bridge Smetka 691 & 709 */
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <BookOpen size={14} />
                  <span>Счетоводен Стандарт НСС 2 / МСС 41 • Природни Бедствия</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Счетоводно отчитане на щети от градушки и застрахователни обезщетения
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  При настъпване на природно бедствие (градушка, измръзване или буря) в земеделското стопанство се прилагат задължителни счетоводни проводки за отписване на унищожената продукция и признаване на обезщетението от застрахователя.
                </p>
              </div>
            </div>

            {/* Standard Journal Flow Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-panel-pro rounded-3xl p-6 border border-rose-500/40 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm uppercase tracking-wider">
                  <span className="rounded-full bg-rose-500 text-white w-6 h-6 inline-flex items-center justify-center text-xs">1</span>
                  <span>Отписване на унищожена реколта</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Сметка 691 „Извънредни разходи“</h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Балансовата стойност или натрупаните до момента разходи за незавършено производство (семена, торове, оран, пръскане) на унищожения от градушката масив се отписват на разход:
                </p>
                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 p-3.5 border border-slate-200 dark:border-slate-800 font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Дебит с/ка 691 Извънредни разходи<br />
                  &nbsp;&nbsp;Кредит с/ка 611 Разходи за осн. деиност (Пшеница)<br />
                  &nbsp;&nbsp;или Кредит с/ка 303 Готова продукция
                </div>
              </div>

              <div className="glass-panel-pro rounded-3xl p-6 border border-emerald-500/40 bg-emerald-500/5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wider">
                  <span className="rounded-full bg-emerald-500 text-white w-6 h-6 inline-flex items-center justify-center text-xs">2</span>
                  <span>Признаване на обезщетението</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Сметка 709 „Други приходи“</h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Въз основа на подписания Оценителен протокол от застрахователната комисия (ДЗИ/Булстрад) се начислява признатото обезщетение и последващото му изплащане по банков път:
                </p>
                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 p-3.5 border border-slate-200 dark:border-slate-800 font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Дебит с/ка 441 Вземания по рекламации (ЗЕАД)<br />
                  &nbsp;&nbsp;Кредит с/ка 709 Други приходи от обезщ.<br />
                  <span className="text-emerald-600">При плащане: Д-т 503 Разплащ. сметка / К-т 441</span>
                </div>
              </div>

              <div className="glass-panel-pro rounded-3xl p-6 border border-teal-500/40 bg-teal-500/5 space-y-3">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wider">
                  <span className="rounded-full bg-teal-500 text-white w-6 h-6 inline-flex items-center justify-center text-xs">3</span>
                  <span>ДДС Третиране по ЗДДС</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Липса на корекция на дан. кредит</h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Съгласно чл. 80, ал. 2, т. 1 от ЗДДС, не се извършава корекция на ползвания данъчен кредит за торове, семена и горива, когато унищожаването на реколтата е причинено от доказано непреодолима сила (градушка, наводнение) с протокол от Общинска служба „Земеделие“.
                </p>
                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 p-3.5 border border-slate-200 dark:border-slate-800 font-mono text-xs font-extrabold text-teal-700 dark:text-teal-300">
                  ✔ Запазване на 100% ползван ДДС кредит<br />
                  ✔ Задължителен протокол от ОСЗ и МХМГ
                </div>
              </div>
            </div>

            {/* Interactive Accounting Generator */}
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-emerald-600" />
                    <span>Автоматично осчетоводяване на изплатените щети за месеца</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">Генериране на Мемориален ордер за импорт в счетоводния софтуер</p>
                </div>

                <button
                  onClick={() => setMemoGenerated(true)}
                  disabled={memoGenerated}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-50 transition flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{memoGenerated ? "Мемориалният ордер е съставен" : "Генерирай Счетоводен Мемориал"}</span>
                </button>
              </div>

              {memoGenerated ? (
                <div className="rounded-[24px] border border-emerald-500/50 bg-slate-50 dark:bg-slate-950 p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-extrabold">
                    <span>СЧЕТОВОДНА СПРАВКА-МЕМОРИАЛ № ЗАСТР-2025/08</span>
                    <span className="text-emerald-600">ОСЧЕТОВОДЕНО</span>
                  </div>

                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                      <tr>
                        <th className="p-3">Основание / Документ</th>
                        <th className="p-3">Дебит Сметка</th>
                        <th className="p-3">Кредит Сметка</th>
                        <th className="p-3 text-right">Сума (лв)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      <tr>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Акт за щета от градушка м. Юни 2025 (180 дка Пшеница)</td>
                        <td className="p-3 text-rose-600 font-mono font-bold">691 Извънредни разходи</td>
                        <td className="p-3 font-mono">611 Разходи за осн. дейност</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">48,000.00 лв</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Оценителен протокол ДЗИ № 88412-09</td>
                        <td className="p-3 font-mono">441 Вземания по рекламации</td>
                        <td className="p-3 text-emerald-600 font-mono font-bold">709 Други приходи от обезщетения</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">42,500.00 лв</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Банково известие за получен превод от ДЗИ ЕАД</td>
                        <td className="p-3 text-emerald-600 font-mono font-bold">503 Разплащателна сметка в лв</td>
                        <td className="p-3 font-mono">441 Вземания по рекламации</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">42,500.00 лв</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-2 text-right font-sans text-xs font-extrabold text-slate-600 dark:text-slate-400">
                    Нетен финансов ефект за стопанството: <span className="text-rose-600 font-mono">-5,500.00 лв (Самообастие / Ликвидационна разлика)</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-bold text-slate-400">
                  Кликнете бутона „Генерирай Счетоводен Мемориал“, за да съставите автоматично проводките за Сметки 691 и 709 въз основа на изплатените щети в регистъра.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
