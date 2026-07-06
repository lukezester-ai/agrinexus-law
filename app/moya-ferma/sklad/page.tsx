"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Package, Plus, Save, Trash2, Edit, Loader2 } from "lucide-react";

type InventoryItem = {
  id: string; name: string; sku: string; category: string;
  unitOfMeasure: string; currentStock: number; minStock: number | null;
};

const CATEGORIES = ["Торове", "Химикали", "Семена", "Гориво", "Резервни части", "Други"];

export default function SkladPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "Други", unitOfMeasure: "бр", currentStock: 0, minStock: 0 });

  const load = async () => {
    setLoading(true);
    try { const r = await fetch("/api/farm/inventory"); setItems(await r.json()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, sku: form.sku || null, category: form.category, unitOfMeasure: form.unitOfMeasure, currentStock: Number(form.currentStock), minStock: form.minStock ? Number(form.minStock) : null };
      if (editing) {
        await fetch("/api/farm/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        await fetch("/api/farm/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load();
      setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/inventory?id=${id}`, { method: "DELETE" });
    await load();
  };

  const lowStock = items.filter((i) => i.minStock && i.currentStock <= i.minStock);

  return (
    <SitePageShell maxWidth="4xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Склад</p>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", sku: "", category: "Други", unitOfMeasure: "бр", currentStock: 0, minStock: 0 }); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нов артикул
        </button>
      </div>
    }>
      {lowStock.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300">
          <strong>{lowStock.length} артикула</strong> са под минималната наличност
        </div>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium"><Package className="text-teal-600 dark:text-teal-400" /> Склад</h1>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Категория</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Мярка</label>
              <select value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="бр">бр</option><option value="кг">кг</option><option value="л">л</option><option value="т">т</option><option value="ml">ml</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Наличност</label>
              <input type="number" step="0.001" value={form.currentStock || ""} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Мин. наличност</label>
              <input type="number" step="0.001" value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Добави"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500"><Package size={40} className="mx-auto mb-3 text-slate-300" /><p>Складът е празен.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Артикул</th><th className="p-3">Категория</th><th className="p-3">Мярка</th><th className="p-3 text-right">Наличност</th><th className="p-3 text-right">Мин.</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((i) => {
                  const isLow = i.minStock !== null && i.currentStock <= i.minStock;
                  return (
                    <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isLow ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                      <td className="p-3 font-medium">{i.name}</td>
                      <td className="p-3 text-slate-600">{i.category || "—"}</td>
                      <td className="p-3 text-slate-600">{i.unitOfMeasure}</td>
                      <td className={`p-3 text-right font-bold ${isLow ? "text-amber-600" : ""}`}>{Number(i.currentStock).toFixed(3)}</td>
                      <td className="p-3 text-right text-slate-500">{i.minStock !== null ? Number(i.minStock).toFixed(3) : "—"}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setForm({ name: i.name, sku: i.sku, category: i.category || "Други", unitOfMeasure: i.unitOfMeasure, currentStock: Number(i.currentStock), minStock: i.minStock !== null ? Number(i.minStock) : 0 }); setEditing(i); setShowForm(true); }} className="text-teal-600 hover:text-teal-800"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                        </div>
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
