"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Shield, Plus, Save, Trash2, Edit, Loader2, Search, X, FileText, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import LinkedDocuments from "@/components/linked-documents";

type Policy = {
  id: string; policyNumber: string; type: string; insurerName: string; brokerName: string | null;
  insuredEntityType: string | null; insuredEntityId: string | null; insuredItemName: string | null;
  coverageDetails: any; startDate: string; endDate: string;
  premiumAmount: number; coverageAmount: number; deductible: number | null;
  status: string; notes: string | null;
};

type Claim = {
  claim: {
    id: string; policyId: string; claimNumber: string; claimDate: string;
    description: string; amountClaimed: number; amountSettled: number | null;
    status: string; notes: string | null;
  };
  policyNumber: string | null; insurerName: string | null; policyType: string | null;
};

const INSURANCE_TYPES: Record<string, string> = {
  crop: "Реколта", machine: "Машина", employee: "Служител",
  property: "Имот", liability: "Отговорност", other: "Друга",
};

const POLICY_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Активна", color: "bg-green-100 text-green-700" },
  expired: { label: "Изтекла", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Прекратена", color: "bg-amber-100 text-amber-700" },
};

const CLAIM_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  filed: { label: "Подадена", color: "bg-blue-100 text-blue-700", icon: Clock },
  approved: { label: "Одобрена", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Отхвърлена", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  paid: { label: "Платена", color: "bg-emerald-100 text-emerald-700", icon: DollarSign },
};

function PoliciesTab() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [form, setForm] = useState({
    type: "crop", insurerName: "", brokerName: "", insuredItemName: "",
    startDate: "", endDate: "", premiumAmount: "", coverageAmount: "", deductible: "",
    insuredEntityType: "", notes: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/farm/insurance/policies");
    const d = await res.json();
    setPolicies(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, premiumAmount: Number(form.premiumAmount), coverageAmount: Number(form.coverageAmount), deductible: form.deductible ? Number(form.deductible) : null };
      if (editing) {
        await fetch(`/api/farm/insurance/policies/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/farm/insurance/policies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load(); setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на полицата?")) return;
    await fetch(`/api/farm/insurance/policies/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  return (<>
    <div className="mb-4 flex items-center justify-end gap-2">
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ type: "crop", insurerName: "", brokerName: "", insuredItemName: "", startDate: "", endDate: "", premiumAmount: "", coverageAmount: "", deductible: "", insuredEntityType: "", notes: "" }); }}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Нова полица
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 font-bold"><Shield size={18} className="text-emerald-600" /> {editing ? "Редактиране" : "Нова"} застраховка</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              {Object.entries(INSURANCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Застраховател</label>
            <input value={form.insurerName} onChange={(e) => setForm({ ...form, insurerName: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Брокер</label>
            <input value={form.brokerName} onChange={(e) => setForm({ ...form, brokerName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Застрахован обект</label>
            <input value={form.insuredItemName} onChange={(e) => setForm({ ...form, insuredItemName: e.target.value })} placeholder="напр. Пшеница 2025, Трактор X, Иван Иванов"
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Начало</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Край</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Премия (лв)</label>
            <input type="number" step="0.01" value={form.premiumAmount} onChange={(e) => setForm({ ...form, premiumAmount: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Застрахователна сума (лв)</label>
            <input type="number" step="0.01" value={form.coverageAmount} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Франшиза (лв)</label>
            <input type="number" step="0.01" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бележки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Създай"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
        </div>
      </form>
    )}

    {policies.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <Shield size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма застрахователни полици. Създайте първата полица.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {policies.map((p) => {
          const st = POLICY_STATUS[p.status] || POLICY_STATUS.active;
          const isExpiring = new Date(p.endDate) < new Date(Date.now() + 30 * 86400000) && p.status === "active";
          return (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Shield size={24} className="mt-1 text-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{p.insuredItemName || INSURANCE_TYPES[p.type]}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                      {isExpiring && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Изтича скоро</span>}
                    </div>
                    <p className="text-xs text-slate-500">{p.insurerName} · {p.policyNumber}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs">
                      <span>От: {new Date(p.startDate).toLocaleDateString("bg-BG")}</span>
                      <span>До: {new Date(p.endDate).toLocaleDateString("bg-BG")}</span>
                      <span className="text-red-600">Премия: {Number(p.premiumAmount).toFixed(2)} лв</span>
                      <span className="text-emerald-600">Покритие: {Number(p.coverageAmount).toFixed(2)} лв</span>
                      {p.deductible ? <span>Франшиза: {Number(p.deductible).toFixed(2)} лв</span> : null}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(p); setForm({ type: p.type, insurerName: p.insurerName, brokerName: p.brokerName || "", insuredItemName: p.insuredItemName || "", startDate: p.startDate.split("T")[0], endDate: p.endDate.split("T")[0], premiumAmount: String(Number(p.premiumAmount)), coverageAmount: String(Number(p.coverageAmount)), deductible: p.deductible ? String(Number(p.deductible)) : "", insuredEntityType: p.insuredEntityType || "", notes: p.notes || "" }); setShowForm(true); }} className="text-emerald-600 hover:text-emerald-800"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-3"><LinkedDocuments module="insurance" entityId={p.id} /></div>
            </div>
          );
        })}
      </div>
    )}
  </>);
}

function ClaimsTab() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ policyId: "", description: "", amountClaimed: "", claimDate: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const [resC, resP] = await Promise.all([
      fetch("/api/farm/insurance/claims"),
      fetch("/api/farm/insurance/policies"),
    ]);
    const [dC, dP] = await Promise.all([resC.json(), resP.json()]);
    setClaims(Array.isArray(dC) ? dC : []);
    setPolicies(Array.isArray(dP) ? dP : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/insurance/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amountClaimed: Number(form.amountClaimed) }) });
      await load(); setShowForm(false); setForm({ policyId: "", description: "", amountClaimed: "", claimDate: "", notes: "" });
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/farm/insurance/claims/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на щетата?")) return;
    await fetch(`/api/farm/insurance/claims/${id}`, { method: "DELETE" });
    await load();
  };

  const filtered = filterStatus ? claims.filter((c) => c.claim.status === filterStatus) : claims;
  const totalClaimed = claims.reduce((s, c) => s + Number(c.claim.amountClaimed), 0);
  const totalSettled = claims.reduce((s, c) => s + Number(c.claim.amountSettled || 0), 0);

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  return (<>
    <div className="mb-4 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Щети</p>
        <p className="text-xl font-bold">{claims.length}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Претендирано</p>
        <p className="text-xl font-bold text-red-600">{totalClaimed.toFixed(2)} лв</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Присъдено</p>
        <p className="text-xl font-bold text-emerald-600">{totalSettled.toFixed(2)} лв</p>
      </div>
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <option value="">Всички статуси</option>
        {Object.entries(CLAIM_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <button onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Нова щета
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Полица</label>
            <select value={form.policyId} onChange={(e) => setForm({ ...form, policyId: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              <option value="">Избери полица</option>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.insuredItemName || INSURANCE_TYPES[p.type]} — {p.policyNumber}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата на щетата</label>
            <input type="date" value={form.claimDate} onChange={(e) => setForm({ ...form, claimDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Претендирана сума (лв)</label>
            <input type="number" step="0.01" value={form.amountClaimed} onChange={(e) => setForm({ ...form, amountClaimed: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Регистрирай
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
        </div>
      </form>
    )}

    {filtered.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <AlertTriangle size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма регистрирани щети.</p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
          <h2 className="flex items-center gap-2 font-bold"><AlertTriangle size={18} className="text-emerald-600" /> Щети ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr><th className="p-3">Номер</th><th className="p-3">Полица</th><th className="p-3">Дата</th><th className="p-3">Описание</th><th className="p-3 text-right">Претендирано</th><th className="p-3 text-right">Присъдено</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(({ claim: c, policyNumber, insurerName }) => {
                const st = CLAIM_STATUS[c.status] || CLAIM_STATUS.filed;
                const StIcon = st.icon;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs">{c.claimNumber}</td>
                    <td className="p-3 text-xs">{policyNumber || "—"}<br /><span className="text-slate-400">{insurerName || ""}</span></td>
                    <td className="p-3 text-xs">{new Date(c.claimDate).toLocaleDateString("bg-BG")}</td>
                    <td className="max-w-[200px] truncate p-3 text-xs">{c.description}</td>
                    <td className="p-3 text-right font-mono text-red-600">{Number(c.amountClaimed).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">{c.amountSettled ? `${Number(c.amountSettled).toFixed(2)}` : "—"}</td>
                    <td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${st.color}`}><StIcon size={12} /> {st.label}</span></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {c.status === "filed" && <button onClick={() => handleStatusChange(c.id, "approved")} className="rounded-lg px-2 py-1 text-xs font-bold text-green-600 hover:bg-green-50">Одобри</button>}
                        {(c.status === "filed" || c.status === "approved") && <button onClick={() => handleStatusChange(c.id, "paid")} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50">Плати</button>}
                        {c.status !== "paid" && c.status !== "rejected" && <button onClick={() => handleStatusChange(c.id, "rejected")} className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Отхвърли</button>}
                        <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>);
}

export default function ZastrahovkiPage() {
  const [tab, setTab] = useState<"policies" | "claims">("policies");

  return (
    <SitePageShell maxWidth="6xl" subheader={
      <p className="text-sm font-semibold">Застраховки</p>
    }>
      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button onClick={() => setTab("policies")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "policies" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <Shield size={16} /> Полици
        </button>
        <button onClick={() => setTab("claims")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "claims" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <AlertTriangle size={16} /> Щети
        </button>
      </div>

      {tab === "policies" && <PoliciesTab />}
      {tab === "claims" && <ClaimsTab />}
    </SitePageShell>
  );
}
