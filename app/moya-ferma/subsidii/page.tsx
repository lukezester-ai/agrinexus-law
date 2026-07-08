"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Landmark, Plus, Save, Trash2, Edit, Loader2, CheckCircle, XCircle, Clock, DollarSign, Map, Search, X, TrendingUp } from "lucide-react";

type Scheme = {
  id: string; name: string; type: string; description: string | null;
  ratePerDecare: number | null; maxArea: number | null; budget: number | null;
  season: string; status: string; isActive: boolean;
};

type App = {
  app: {
    id: string; schemeId: string; season: string; applicationNumber: string | null;
    status: string; totalArea: number | null; amountExpected: number | null;
    amountReceived: number | null; submissionDate: string | null;
    approvalDate: string | null; paymentDate: string | null;
    fields: any; notes: string | null;
  };
  schemeName: string | null; schemeType: string | null;
};

const SCHEME_TYPES: Record<string, string> = {
  area: "Площ",
  coupled: "Обвързана",
  eco: "Екосхема",
  ndr: "НРД",
  rural: "ПРСР",
  investment: "Инвестиция",
};

const APP_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Чернова", color: "bg-slate-100 text-slate-600", icon: Clock },
  submitted: { label: "Подадено", color: "bg-blue-100 text-blue-700", icon: Clock },
  approved: { label: "Одобрено", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Отхвърлено", color: "bg-red-100 text-red-700", icon: XCircle },
  paid: { label: "Платено", color: "bg-emerald-100 text-emerald-700", icon: DollarSign },
};

const STATUSES = ["draft", "submitted", "approved", "rejected", "paid"];

function SchemesTab() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Scheme | null>(null);
  const [form, setForm] = useState({ name: "", type: "area", description: "", ratePerDecare: "", maxArea: "", budget: "", season: String(new Date().getFullYear()), status: "active" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/farm/subsidies/schemes");
    const d = await res.json();
    setSchemes(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, type: form.type, description: form.description || null, rate_per_decare: form.ratePerDecare || null, max_area: form.maxArea || null, budget: form.budget || null, season: form.season, status: form.status };
      if (editing) {
        await fetch(`/api/farm/subsidies/schemes/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/farm/subsidies/schemes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load(); setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на схемата?")) return;
    await fetch(`/api/farm/subsidies/schemes/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  return (<>
    <div className="mb-4 flex items-center justify-end gap-2">
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", type: "area", description: "", ratePerDecare: "", maxArea: "", budget: "", season: String(new Date().getFullYear()), status: "active" }); }}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Нова схема
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име на схемата</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              {Object.entries(SCHEME_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Сезон (година)</label>
            <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ставка (лв/дка)</label>
            <input type="number" step="0.01" value={form.ratePerDecare} onChange={(e) => setForm({ ...form, ratePerDecare: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Макс. площ (дка)</label>
            <input type="number" step="0.1" value={form.maxArea} onChange={(e) => setForm({ ...form, maxArea: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бюджет (лв)</label>
            <input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Добави"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
        </div>
      </form>
    )}

    {schemes.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <Landmark size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма схеми. Добавете първата схема за ДФЗ субсидии.</p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
          <h2 className="flex items-center gap-2 font-bold"><Landmark size={18} className="text-emerald-600" /> Схеми за субсидиране ({schemes.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr><th className="p-3">Име</th><th className="p-3">Тип</th><th className="p-3">Сезон</th><th className="p-3 text-right">Ставка (лв/дка)</th><th className="p-3 text-right">Макс. площ</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {schemes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold">{s.name}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{SCHEME_TYPES[s.type] || s.type}</span></td>
                  <td className="p-3">{s.season}</td>
                  <td className="p-3 text-right font-mono">{s.ratePerDecare ? `${Number(s.ratePerDecare).toFixed(2)} лв` : "—"}</td>
                  <td className="p-3 text-right font-mono">{s.maxArea ? `${Number(s.maxArea).toFixed(1)} дка` : "—"}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "closed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{s.status === "active" ? "Активна" : s.status === "closed" ? "Затворена" : "Предстояща"}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(s); setForm({ name: s.name, type: s.type, description: s.description || "", ratePerDecare: s.ratePerDecare?.toString() || "", maxArea: s.maxArea?.toString() || "", budget: s.budget?.toString() || "", season: s.season, status: s.status }); setShowForm(true); }} className="text-emerald-600 hover:text-emerald-800"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>);
}

function ApplicationsTab() {
  const [apps, setApps] = useState<App[]>([]);
  const [fields, setFields] = useState<{ id: string; name: string; areaDecares: number; crop: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ schemeId: "", season: String(new Date().getFullYear()), status: "draft", selectedFields: [] as string[], notes: "" });

  const load = async () => {
    setLoading(true);
    const [resApps, resFields] = await Promise.all([
      fetch("/api/farm/subsidies/applications"),
      fetch("/api/farm/fields"),
    ]);
    const dApps = await resApps.json();
    const dFields = await resFields.json();
    setApps(Array.isArray(dApps) ? dApps : []);
    setFields(Array.isArray(dFields) ? dFields.filter((f: any) => f.isActive !== false) : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  useEffect(() => {
    fetch("/api/farm/subsidies/schemes").then((r) => r.json()).then((d) => setSchemes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const scheme = schemes.find((s) => s.id === form.schemeId);
      const rate = scheme?.ratePerDecare ? Number(scheme.ratePerDecare) : 0;
      const appFields = form.selectedFields.map((fid) => {
        const f = fields.find((ff) => ff.id === fid);
        return { fieldId: fid, fieldName: f?.name || "", area: Number(f?.areaDecares || 0), crop: f?.crop || "" };
      });

      const payload = { schemeId: form.schemeId, season: form.season, status: form.status, fields: appFields, notes: form.notes || null, submission_date: form.status === "submitted" ? new Date().toISOString() : null };

      if (editing) {
        await fetch(`/api/farm/subsidies/applications/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/farm/subsidies/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load(); setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const payload: any = { status };
    if (status === "submitted") payload.submission_date = new Date().toISOString();
    if (status === "approved") payload.approval_date = new Date().toISOString();
    if (status === "paid") {
      payload.payment_date = new Date().toISOString();
      const app = apps.find((a) => a.app.id === id);
      payload.amount_received = app?.app.amountExpected?.toString() || "0";
    }
    await fetch(`/api/farm/subsidies/applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на заявлението?")) return;
    await fetch(`/api/farm/subsidies/applications/${id}`, { method: "DELETE" });
    await load();
  };

  const filtered = apps.filter((a) => {
    const statusMatch = !filterStatus || a.app.status === filterStatus;
    const searchMatch = !search || a.app.applicationNumber?.toLowerCase().includes(search.toLowerCase()) || a.schemeName?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const totalExpected = apps.reduce((s, a) => s + Number(a.app.amountExpected || 0), 0);
  const totalReceived = apps.reduce((s, a) => s + Number(a.app.amountReceived || 0), 0);
  const activeApps = apps.filter((a) => a.app.status !== "draft");

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  return (<>
    <div className="mb-4 grid gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Заявления</p>
        <p className="text-xl font-bold">{apps.length}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Очаквана субсидия</p>
        <p className="text-xl font-bold text-amber-600">{totalExpected.toFixed(2)} лв</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Получено</p>
        <p className="text-xl font-bold text-emerald-600">{totalReceived.toFixed(2)} лв</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Активни</p>
        <p className="text-xl font-bold">{activeApps.length}</p>
      </div>
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по номер или схема..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
      </div>
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <option value="">Всички статуси</option>
        {STATUSES.map((s) => <option key={s} value={s}>{APP_STATUS[s].label}</option>)}
      </select>
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ schemeId: "", season: String(new Date().getFullYear()), status: "draft", selectedFields: [], notes: "" }); }}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Ново заявление
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 font-bold"><Plus size={18} className="text-emerald-600" /> {editing ? "Редактиране" : "Ново"} заявление</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Схема</label>
            <select value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              <option value="">Избери схема</option>
              {schemes.filter((s) => s.isActive).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.season})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Сезон</label>
            <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} required
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Полета (изберете за кои кандидатствате)</label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {fields.map((f) => (
                <label key={f.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input type="checkbox" checked={form.selectedFields.includes(f.id)} onChange={() => setForm({ ...form, selectedFields: form.selectedFields.includes(f.id) ? form.selectedFields.filter((id) => id !== f.id) : [...form.selectedFields, f.id] })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="flex-1">{f.name}</span>
                  <span className="text-xs text-slate-500">{Number(f.areaDecares).toFixed(1)} дка — {f.crop || "—"}</span>
                </label>
              ))}
            </div>
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

    {filtered.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <TrendingUp size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма заявления. Създайте схема и след това подайте заявление.</p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
          <h2 className="flex items-center gap-2 font-bold"><TrendingUp size={18} className="text-emerald-600" /> Заявления за субсидии ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr><th className="p-3">Номер</th><th className="p-3">Схема</th><th className="p-3">Сезон</th><th className="p-3 text-right">Площ (дка)</th><th className="p-3 text-right">Очаквано</th><th className="p-3 text-right">Получено</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(({ app: a, schemeName }) => {
                const st = APP_STATUS[a.status] || APP_STATUS.draft;
                const StIcon = st.icon;
                return (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs">{a.applicationNumber || "—"}</td>
                    <td className="p-3">{schemeName || "—"}</td>
                    <td className="p-3">{a.season}</td>
                    <td className="p-3 text-right font-mono">{a.totalArea ? Number(a.totalArea).toFixed(2) : "—"}</td>
                    <td className="p-3 text-right font-mono text-amber-600">{a.amountExpected ? `${Number(a.amountExpected).toFixed(2)} лв` : "—"}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">{a.amountReceived ? `${Number(a.amountReceived).toFixed(2)} лв` : "—"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${st.color}`}><StIcon size={12} /> {st.label}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {a.status === "draft" && <button onClick={() => handleStatusChange(a.id, "submitted")} className="rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50">Подай</button>}
                        {a.status === "submitted" && <button onClick={() => handleStatusChange(a.id, "approved")} className="rounded-lg px-2 py-1 text-xs font-bold text-green-600 hover:bg-green-50">Одобри</button>}
                        {(a.status === "submitted" || a.status === "approved") && <button onClick={() => handleStatusChange(a.id, "paid")} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50">Плати</button>}
                        {a.status !== "paid" && a.status !== "rejected" && <button onClick={() => handleStatusChange(a.id, "rejected")} className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Отхвърли</button>}
                        <button onClick={() => handleDelete(a.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
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

export default function SubsidiiPage() {
  const [tab, setTab] = useState<"schemes" | "applications">("schemes");

  return (
    <SitePageShell maxWidth="6xl" subheader={
      <p className="text-sm font-semibold">ДФЗ субсидии и подпомагане</p>
    }>
      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button onClick={() => setTab("schemes")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "schemes" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <Landmark size={16} /> Схеми
        </button>
        <button onClick={() => setTab("applications")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "applications" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <TrendingUp size={16} /> Заявления
        </button>
      </div>

      {tab === "schemes" && <SchemesTab />}
      {tab === "applications" && <ApplicationsTab />}
    </SitePageShell>
  );
}
