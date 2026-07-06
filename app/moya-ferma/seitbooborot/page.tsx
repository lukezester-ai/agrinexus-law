"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Repeat2, Plus, Save, Trash2, Search, X, Loader2 } from "lucide-react";

type Rotation = {
  id: string; fieldId: string | null; year: string; plannedCrop: string;
  cropVariety: string | null; previousCrop: string | null;
  status: string; notes: string | null;
};

const CROP_OPTIONS = ["Пшеница", "Ечемик", "Царевица", "Слънчоглед", "Рапица", "Бобови", "Люцерна", "Сорго", "Овес", "Ръж", "Друго"];
const ROTATION_RULES: Record<string, string[]> = {
  "Пшеница": ["Рапица", "Слънчоглед", "Бобови", "Царевица", "Ечемик"],
  "Ечемик": ["Рапица", "Слънчоглед", "Бобови", "Царевица"],
  "Царевица": ["Пшеница", "Ечемик", "Бобови", "Слънчоглед"],
  "Слънчоглед": ["Пшеница", "Ечемик", "Царевица", "Бобови", "Рапица"],
  "Рапица": ["Пшеница", "Ечемик", "Бобови"],
  "Бобови": ["Пшеница", "Ечемик", "Царевица", "Слънчоглед", "Рапица"],
};

export default function SeitbooborotPage() {
  const [plans, setPlans] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ year: String(new Date().getFullYear()), plannedCrop: "Пшеница", cropVariety: "", previousCrop: "", status: "planned", notes: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/farm/crop-rotation");
    setPlans(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { year: form.year, plannedCrop: form.plannedCrop, cropVariety: form.cropVariety || null, previousCrop: form.previousCrop || null, status: form.status, notes: form.notes || null };
      if (editingId) {
        await fetch("/api/farm/crop-rotation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...payload }) });
      } else {
        await fetch("/api/farm/crop-rotation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load();
      setShowForm(false); setEditingId(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/crop-rotation?id=${id}`, { method: "DELETE" });
    await load();
  };

  const filtered = plans.filter((p) =>
    p.plannedCrop.toLowerCase().includes(search.toLowerCase()) ||
    (p.previousCrop && p.previousCrop.toLowerCase().includes(search.toLowerCase())) ||
    p.year.includes(search)
  );

  const getCompatibility = (crop: string, prev: string | null): "good" | "bad" | "neutral" => {
    if (!prev) return "neutral";
    if (crop === prev) return "bad";
    const allowed = ROTATION_RULES[crop];
    if (!allowed) return "neutral";
    return allowed.includes(prev) ? "good" : "bad";
  };

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Сеитбооборот</p>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ year: String(new Date().getFullYear()), plannedCrop: "Пшеница", cropVariety: "", previousCrop: "", status: "planned", notes: "" }); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нов план
        </button>
      </div>
    }>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Съвместимост на култури</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">✅ Препоръчителен предшественик</span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900/50 dark:text-red-300">❌ Не е препоръчителен</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">➖ Няма данни</span>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по култура, предшественик или година..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Година</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Планирана култура</label>
              <select value={form.plannedCrop} onChange={(e) => setForm({ ...form, plannedCrop: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                {CROP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Сорт</label>
              <input value={form.cropVariety} onChange={(e) => setForm({ ...form, cropVariety: e.target.value })} placeholder="например: Антарес"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Предшественик</label>
              <select value={form.previousCrop} onChange={(e) => setForm({ ...form, previousCrop: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">— Няма —</option>
                {CROP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Статус</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="planned">Планиран</option>
                <option value="active">Активен</option>
                <option value="completed">Приключен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бележки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          {form.previousCrop && form.plannedCrop && (
            <div className="mt-3 text-sm">
              Съвместимост:
              <span className={`ml-2 font-bold ${getCompatibility(form.plannedCrop, form.previousCrop) === "good" ? "text-emerald-600" : getCompatibility(form.plannedCrop, form.previousCrop) === "bad" ? "text-red-600" : "text-slate-600"}`}>
                {getCompatibility(form.plannedCrop, form.previousCrop) === "good" ? "✅ добър предшественик" : getCompatibility(form.plannedCrop, form.previousCrop) === "bad" ? "❌ неподходящ" : "➖ няма данни"}
              </span>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editingId ? "Запази" : "Добави"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
          </div>
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-violet-50/50 p-6 dark:bg-violet-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium">
            <Repeat2 className="text-violet-600 dark:text-violet-400" /> Сеитбооборот
          </h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500"><Repeat2 size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма планове за сеитбооборот.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Година</th><th className="p-3">Култура</th><th className="p-3">Сорт</th><th className="p-3">Предшественик</th><th className="p-3">Съвместимост</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((p) => {
                  const compat = getCompatibility(p.plannedCrop, p.previousCrop);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{p.year}</td>
                      <td className="p-3">{p.plannedCrop}</td>
                      <td className="p-3 text-slate-600">{p.cropVariety || "—"}</td>
                      <td className="p-3 text-slate-600">{p.previousCrop || "—"}</td>
                      <td className="p-3">
                        {compat === "good" ? <span className="text-emerald-600">✅</span> : compat === "bad" ? <span className="text-red-600">❌</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          p.status === "planned" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" :
                          p.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" :
                          p.status === "completed" ? "bg-slate-100 text-slate-600 dark:bg-slate-800" :
                          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                        }`}>
                          {p.status === "planned" ? "Планиран" : p.status === "active" ? "Активен" : p.status === "completed" ? "Приключен" : "Отменен"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
