"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Wheat, Plus, Save, Trash2, Edit, Search, X, Loader2 } from "lucide-react";

type Harvest = {
  id: string; fieldId: string | null; cropId: string | null; date: string;
  areaDecares: number; yieldAmount: number; yieldUnit: string;
  moisture: number | null; quality: string | null; notes: string;
};

export default function RekoltaPage() {
  const [records, setRecords] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Harvest | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fieldId: "", cropId: "", date: "", areaDecares: 0, yieldAmount: 0, yieldUnit: "kg", moisture: "", quality: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/farm/harvest");
    setRecords(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { fieldId: form.fieldId || null, cropId: form.cropId || null, date: form.date || new Date().toISOString().split("T")[0], areaDecares: Number(form.areaDecares), yieldAmount: Number(form.yieldAmount), yieldUnit: form.yieldUnit, moisture: form.moisture || null, quality: form.quality || null, notes: form.notes || null };
      if (editing) {
        await fetch(`/api/farm/harvest/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/farm/harvest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load();
      setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/harvest/${id}`, { method: "DELETE" });
    await load();
  };

  const filtered = records.filter((r) =>
    r.notes?.toLowerCase().includes(search.toLowerCase()) || r.quality?.toLowerCase().includes(search.toLowerCase())
  );

  const totalYield = records.reduce((s, r) => s + r.yieldAmount, 0);
  const totalArea = records.reduce((s, r) => s + r.areaDecares, 0);

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Реколта и добиви</p>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ fieldId: "", cropId: "", date: new Date().toISOString().split("T")[0], areaDecares: 0, yieldAmount: 0, yieldUnit: "kg", moisture: "", quality: "", notes: "" }); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нов запис
        </button>
      </div>
    }>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Записи</p>
          <p className="text-xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо площ (дка)</p>
          <p className="text-xl font-bold">{totalArea.toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо добив</p>
          <p className="text-xl font-bold">{totalYield.toFixed(0)} kg</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Площ (дка)</label>
              <input type="number" step="0.1" value={form.areaDecares || ""} onChange={(e) => setForm({ ...form, areaDecares: Number(e.target.value) })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Добив</label>
              <input type="number" step="0.1" value={form.yieldAmount || ""} onChange={(e) => setForm({ ...form, yieldAmount: Number(e.target.value) })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Мерна единица</label>
              <select value={form.yieldUnit} onChange={(e) => setForm({ ...form, yieldUnit: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="kg">kg</option>
                <option value="t">t</option>
                <option value="broi">брой</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Влажност (%)</label>
              <input type="number" step="0.1" value={form.moisture} onChange={(e) => setForm({ ...form, moisture: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Качество</label>
              <select value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">--</option>
                <option value="Високо">Високо</option>
                <option value="Средно">Средно</option>
                <option value="Ниско">Ниско</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бележки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Добави"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
          </div>
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-emerald-50/50 p-6 dark:bg-emerald-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium">
            <Wheat className="text-emerald-600 dark:text-emerald-400" /> Реколта
          </h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500"><Wheat size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма записи за реколта.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Дата</th><th className="p-3 text-right">Площ (дка)</th><th className="p-3 text-right">Добив</th><th className="p-3 text-right">Влажност</th><th className="p-3">Качество</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">{new Date(r.date).toLocaleDateString("bg-BG")}</td>
                    <td className="p-3 text-right font-mono">{r.areaDecares.toFixed(1)}</td>
                    <td className="p-3 text-right font-mono">{r.yieldAmount.toFixed(0)} <span className="text-xs text-slate-500">{r.yieldUnit}</span></td>
                    <td className="p-3 text-right font-mono">{r.moisture !== null ? `${r.moisture}%` : "—"}</td>
                    <td className="p-3">{r.quality || "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(r); setForm({ fieldId: r.fieldId || "", cropId: r.cropId || "", date: r.date.split("T")[0], areaDecares: r.areaDecares, yieldAmount: r.yieldAmount, yieldUnit: r.yieldUnit, moisture: r.moisture?.toString() || "", quality: r.quality || "", notes: r.notes || "" }); setShowForm(true); }} className="text-emerald-600 hover:text-emerald-800"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
