"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Package, Plus, Calculator, Trash2, Loader2, X } from "lucide-react";

type FixedAsset = {
  id: string; inventoryNumber: string; name: string; category: string;
  acquisitionDate: string; acquisitionCost: number; salvageValue: number;
  usefulLifeMonths: number; amortizationMethod: string;
  accumulatedAmortization: number; bookValue: number;
  location: string; notes: string; isActive: string;
  writtenOffAt: string | null;
};

type ScheduleEntry = { month: number; date: string; amount: number; bookValue: number };

const CATEGORIES = ["Сгради", "Машини", "Съоръжения", "Транспорт", "Оборудване", "Други"];

export default function DmaPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [form, setForm] = useState({
    inventoryNumber: "", name: "", category: "Други", acquisitionDate: "",
    acquisitionCost: 0, salvageValue: 0, usefulLifeMonths: 0,
    location: "", notes: "",
  });
  const [scheduleAsset, setScheduleAsset] = useState<FixedAsset | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await fetch("/api/farm/fixed-assets"); const d = await r.json(); setAssets(Array.isArray(d) ? d : []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/fixed-assets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await load();
      setShowForm(false);
      setForm({ inventoryNumber: "", name: "", category: "Други", acquisitionDate: "", acquisitionCost: 0, salvageValue: 0, usefulLifeMonths: 0, location: "", notes: "" });
    } finally { setSaving(false); }
  };

  const handleAmortize = async () => {
    setCalcLoading(true);
    try {
      await fetch("/api/farm/fixed-assets/amortize", { method: "POST" });
      await load();
    } finally { setCalcLoading(false); }
  };

  const handleWriteOff = async (id: string) => {
    await fetch(`/api/farm/fixed-assets/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: 'false', writtenOffAt: new Date().toISOString() }),
    });
    await load();
  };

  const openSchedule = async (asset: FixedAsset) => {
    setScheduleAsset(asset);
    setScheduleLoading(true);
    try {
      const { generateAmortizationSchedule } = await import("@/lib/fixed-assets/amortization");
      const sched = generateAmortizationSchedule({
        acquisitionCost: asset.acquisitionCost,
        salvageValue: asset.salvageValue,
        usefulLifeMonths: asset.usefulLifeMonths,
        acquisitionDate: asset.acquisitionDate,
      });
      setSchedule(sched);
    } finally { setScheduleLoading(false); }
  };

  return (
    <SitePageShell maxWidth="7xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">ДМА — Дълготрайни материални активи</p>
        <div className="flex gap-2">
          <button onClick={handleAmortize} disabled={calcLoading}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
            {calcLoading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />} Изчисли амортизация
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <Plus size={16} /> Добави актив
          </button>
        </div>
      </div>
    }>
      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium"><Package className="text-teal-600 dark:text-teal-400" /> ДМА</h1>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Инв. номер</label>
              <input value={form.inventoryNumber} onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
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
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата на придобиване</label>
              <input type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Стойност (лв)</label>
              <input type="number" step="0.01" value={form.acquisitionCost || ""} onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Остатъчна стойност (лв)</label>
              <input type="number" step="0.01" value={form.salvageValue || ""} onChange={(e) => setForm({ ...form, salvageValue: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Аморт. срок (мес.)</label>
              <input type="number" value={form.usefulLifeMonths || ""} onChange={(e) => setForm({ ...form, usefulLifeMonths: Number(e.target.value) })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Място</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бележки</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Добави
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500"><Package size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма въведени активи.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="p-3">Инв. №</th>
                  <th className="p-3">Име</th>
                  <th className="p-3">Категория</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3 text-right">Стойност</th>
                  <th className="p-3 text-right">Аморт. срок (мес.)</th>
                  <th className="p-3 text-right">Натрупана аморт.</th>
                  <th className="p-3 text-right">Балансова стойност</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium">{a.inventoryNumber}</td>
                    <td className="p-3">
                      <button onClick={() => openSchedule(a)} className="text-left font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                        {a.name}
                      </button>
                    </td>
                    <td className="p-3 text-slate-600">{a.category || "—"}</td>
                    <td className="p-3 text-slate-600">{new Date(a.acquisitionDate).toLocaleDateString("bg-BG")}</td>
                    <td className="p-3 text-right font-medium">{Number(a.acquisitionCost).toFixed(2)} лв</td>
                    <td className="p-3 text-right text-slate-600">{a.usefulLifeMonths}</td>
                    <td className="p-3 text-right">{Number(a.accumulatedAmortization).toFixed(2)} лв</td>
                    <td className="p-3 text-right font-bold">{Number(a.bookValue).toFixed(2)} лв</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.isActive === 'true' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                        {a.isActive === 'true' ? 'Активен' : 'Отписан'}
                      </span>
                    </td>
                    <td className="p-3">
                      {a.isActive === 'true' && (
                        <button onClick={() => handleWriteOff(a.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="Отпиши">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {scheduleAsset && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Calculator className="text-amber-600" size={20} /> Амортизационен план — {scheduleAsset.name}</h2>
              <button onClick={() => setScheduleAsset(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs text-slate-500">Стойност</span>
                <p className="font-bold">{Number(scheduleAsset.acquisitionCost).toFixed(2)} лв</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs text-slate-500">Месечна аморт.</span>
                <p className="font-bold">{schedule.length > 0 ? schedule[0].amount.toFixed(2) : "0.00"} лв</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs text-slate-500">Срок</span>
                <p className="font-bold">{scheduleAsset.usefulLifeMonths} мес.</p>
              </div>
            </div>
            {scheduleLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                    <tr>
                      <th className="p-2">Месец</th>
                      <th className="p-2">Дата</th>
                      <th className="p-2 text-right">Сума</th>
                      <th className="p-2 text-right">Балансова стойност</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {schedule.map((entry) => (
                      <tr key={entry.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2">{entry.month}</td>
                        <td className="p-2 text-slate-600">{new Date(entry.date).toLocaleDateString("bg-BG")}</td>
                        <td className="p-2 text-right font-medium">{entry.amount.toFixed(2)} лв</td>
                        <td className="p-2 text-right font-bold">{entry.bookValue.toFixed(2)} лв</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
