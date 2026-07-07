"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Package, Plus, Save, Trash2, Edit, Loader2, ArrowUpDown, ArrowDown, ArrowUp, X, Search, Download } from "lucide-react";

type InventoryItem = {
  id: string; name: string; sku: string; category: string;
  unitOfMeasure: string; currentStock: number; minStock: number | null; barcode: string | null;
};

type Movement = {
  id: string; item_id: string; item_name: string; type: string;
  quantity: number; unitCost: number | null; totalCost: number | null;
  movement_date: string; description: string | null;
};

const CATEGORIES = ["Торове", "Химикали", "Семена", "Гориво", "Резервни части", "Други"];

export default function SkladPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "Други", unitOfMeasure: "бр", currentStock: 0, minStock: 0, barcode: "" });
  const [search, setSearch] = useState("");

  const [movItem, setMovItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [showMovForm, setShowMovForm] = useState(false);
  const [movForm, setMovForm] = useState({ type: "in", quantity: 0, unitCost: "", totalCost: "", description: "" });

  const load = async () => {
    setLoading(true);
    try { const r = await fetch("/api/farm/inventory"); const d = await r.json(); setItems(Array.isArray(d) ? d : []); }
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
        const r = await fetch("/api/farm/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const created = await r.json();
        if (form.barcode) {
          await fetch("/api/farm/inventory/codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: created.id, code: form.barcode, codeType: "ean", isPrimary: "true" }) });
        }
      }
      await load();
      setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/inventory?id=${id}`, { method: "DELETE" });
    await load();
  };

  const openMovements = async (item: InventoryItem) => {
    setMovItem(item);
    setLoadingMovs(true);
    try {
      const r = await fetch("/api/farm/inventory/movements");
      const d = await r.json();
      setMovements(Array.isArray(d) ? d.filter((m: Movement) => m.item_id === item.id) : []);
    } finally { setLoadingMovs(false); }
  };

  const addMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movItem) return;
    setSaving(true);
    try {
      const qty = Number(movForm.quantity);
      await fetch("/api/farm/inventory/movements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: movItem.id, type: movForm.type, quantity: qty,
          unitCost: movForm.unitCost || null, totalCost: movForm.totalCost || null,
          description: movForm.description || null,
        }),
      });
      await openMovements(movItem);
      await load();
      setShowMovForm(false);
      setMovForm({ type: "in", quantity: 0, unitCost: "", totalCost: "", description: "" });
    } finally { setSaving(false); }
  };

  const lowStock = items.filter((i) => i.minStock && i.currentStock <= i.minStock);
  const q = search.toLowerCase();
  const filteredItems = search ? items.filter((i) => i.name.toLowerCase().includes(q) || (i.barcode && i.barcode.toLowerCase().includes(q))) : items;

  const exportCsv = (data: any[], columns: { key: string; label: string }[], filename: string) => {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const val = c.key.split('.').reduce((o, k) => o?.[k], row);
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = '\ufeff' + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Склад</p>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", sku: "", category: "Други", unitOfMeasure: "бр", currentStock: 0, minStock: 0, barcode: "" }); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нов артикул
        </button>
        <button onClick={() => exportCsv(items, [
          { key: 'name', label: 'Име' },
          { key: 'category', label: 'Категория' },
          { key: 'unitOfMeasure', label: 'Мярка' },
          { key: 'currentStock', label: 'Наличност' },
          { key: 'minStock', label: 'Мин. запас' },
          { key: 'sku', label: 'Код' },
        ], 'sklad.csv')} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300">
          <Download size={16} /> CSV
        </button>
      </div>
    }>
      {lowStock.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300">
          <strong>{lowStock.length} артикула</strong> са под минималната наличност
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по име или баркод…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
      </div>

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
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Баркод (EAN)</label>
              <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="..."
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
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
                <tr><th className="p-3">Артикул</th><th className="p-3">Код</th><th className="p-3">Категория</th><th className="p-3">Мярка</th><th className="p-3 text-right">Наличност</th><th className="p-3 text-right">Мин.</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredItems.map((i) => {
                  const isLow = i.minStock !== null && i.currentStock <= i.minStock;
                  return (
                    <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isLow ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                      <td className="p-3 font-medium">{i.name}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{i.barcode || "—"}</td>
                      <td className="p-3 text-slate-600">{i.category || "—"}</td>
                      <td className="p-3 text-slate-600">{i.unitOfMeasure}</td>
                      <td className={`p-3 text-right font-bold ${isLow ? "text-amber-600" : ""}`}>{Number(i.currentStock).toFixed(3)}</td>
                      <td className="p-3 text-right text-slate-500">{i.minStock !== null ? Number(i.minStock).toFixed(3) : "—"}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openMovements(i)} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30" title="Движения"><ArrowUpDown size={16} /></button>
                          <button onClick={() => { setForm({ name: i.name, sku: i.sku, category: i.category || "Други", unitOfMeasure: i.unitOfMeasure, currentStock: Number(i.currentStock), minStock: i.minStock !== null ? Number(i.minStock) : 0, barcode: i.barcode || "" }); setEditing(i); setShowForm(true); }} className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(i.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
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

      {movItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><ArrowUpDown className="text-amber-600" size={20} /> Движения — {movItem.name}</h2>
              <div className="flex gap-2">
                <button onClick={() => { setShowMovForm(!showMovForm); setMovForm({ type: "in", quantity: 0, unitCost: "", totalCost: "", description: "" }); }}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-700">
                  <Plus size={14} /> Движение
                </button>
                <button onClick={() => setMovItem(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-500">Наличност: <strong className="text-slate-800 dark:text-white">{Number(movItem.currentStock).toFixed(3)}</strong> {movItem.unitOfMeasure}</p>

            {showMovForm && (
              <form onSubmit={addMovement} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Тип</label>
                  <select value={movForm.type} onChange={(e) => setMovForm({ ...movForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
                    <option value="in">Приход</option><option value="out">Разход</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Количество</label>
                  <input type="number" step="0.001" value={movForm.quantity || ""} onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) })} required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Ед. цена (лв)</label>
                  <input type="number" step="0.01" value={movForm.unitCost} onChange={(e) => setMovForm({ ...movForm, unitCost: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Обща цена (лв)</label>
                  <input type="number" step="0.01" value={movForm.totalCost} onChange={(e) => setMovForm({ ...movForm, totalCost: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600">Описание</label>
                  <input value={movForm.description} onChange={(e) => setMovForm({ ...movForm, description: e.target.value })} placeholder="Закупка / Продажба / Производство"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="flex items-end sm:col-span-2">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Осчетови
                  </button>
                </div>
              </form>
            )}

            {loadingMovs ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
            ) : movements.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Няма движения.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${m.type === "in" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"}`}>
                          {m.type === "in" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {m.type === "in" ? "Приход" : "Разход"}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(m.movement_date).toLocaleDateString("bg-BG")}</span>
                        <span className="text-xs font-bold">{Number(m.quantity).toFixed(3)}</span>
                      </div>
                      {m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}
                      <div className="mt-1 flex gap-4 text-xs text-slate-500">
                        {m.unitCost !== null && <span>Ед. цена: {Number(m.unitCost).toFixed(2)} лв</span>}
                        {m.totalCost !== null && <span>Общо: {Number(m.totalCost).toFixed(2)} лв</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
