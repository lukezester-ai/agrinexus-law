"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Wheat, Plus, Save, Trash2, Edit, Search, X, Loader2, FileText, TrendingUp, TrendingDown, DollarSign, Combine, Sprout, Fuel, Wrench } from "lucide-react";

type Harvest = {
  id: string; fieldId: string | null; cropId: string | null; date: string;
  areaDecares: number; yieldAmount: number; yieldUnit: string;
  moisture: number | null; quality: string | null; notes: string;
};

type Invoice = {
  id: string; invoiceNumber: string; type: string;
  clientName: string | null; issueDate: string;
  totalAmount: number; items: any; status: string;
};

type CostRow = {
  fieldId: string; fieldName: string; areaDecares: number; crop: string | null;
  totalYield: number; yieldUnit: string;
  seedCost: number; fertilizerCost: number; chemicalCost: number;
  fuelCost: number; servicesCost: number; otherCost: number;
  totalCost: number; costPerDecare: number; costPerUnit: number;
};

type CostSummary = {
  totalCost: number; totalYield: number;
  weightedCostPerDecare: number; weightedCostPerUnit: number;
  totalAreaDecares: number;
  cropBreakdown: { crop: string; area: number; yield: number; cost: number }[];
};

function HarvestTab() {
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
    const d = await res.json();
    setRecords(Array.isArray(d) ? d : []);
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

  return (<>
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

    <div className="flex items-center justify-end gap-2 mb-4">
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ fieldId: "", cropId: "", date: new Date().toISOString().split("T")[0], areaDecares: 0, yieldAmount: 0, yieldUnit: "kg", moisture: "", quality: "", notes: "" }); }}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Нов запис
      </button>
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

    <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
        <h2 className="flex items-center gap-2 font-bold"><Combine size={18} className="text-emerald-600" /> Календар на жътва</h2>
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
  </>);
}

function FinanceTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/accounting/invoices");
        const d = await res.json();
        setInvoices(Array.isArray(d) ? d.filter((inv: any) => inv.type === 'sales') : []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.totalAmount), 0);
  const countByStatus = (status: string) => invoices.filter((i) => i.status === status).length;

  return (<>
    <div className="mb-4 grid gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Фактури продажби</p>
        <p className="text-xl font-bold">{invoices.length}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Приходи (общо)</p>
        <p className="text-xl font-bold text-emerald-600">{totalRevenue.toFixed(2)} лв</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Чернови</p>
        <p className="text-xl font-bold text-amber-600">{countByStatus("draft")}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">Осчетоводени</p>
        <p className="text-xl font-bold text-emerald-600">{countByStatus("posted")}</p>
      </div>
    </div>

    {loading ? (
      <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
    ) : invoices.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <FileText size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма фактури за продажби. Създайте фактура в <a href="/moya-ferma/schetovodstvo/smetki" className="text-emerald-600 underline">Счетоводство → Сметки</a></p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
          <h2 className="flex items-center gap-2 font-bold"><FileText size={18} className="text-emerald-600" /> Фактури продажби ({invoices.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr><th className="p-3">Номер</th><th className="p-3">Клиент</th><th className="p-3">Дата</th><th className="p-3 text-right">Сума</th><th className="p-3">Статус</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.clientName || "—"}</td>
                  <td className="p-3">{new Date(inv.issueDate).toLocaleDateString("bg-BG")}</td>
                  <td className="p-3 text-right font-mono">{Number(inv.totalAmount).toFixed(2)} лв</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${inv.status === "posted" ? "bg-emerald-100 text-emerald-700" : inv.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {inv.status === "posted" ? "Осчетоводена" : inv.status === "sent" ? "Изпратена" : "Чернова"}
                    </span>
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

function CostAnalysisTab() {
  const [rows, setRows] = useState<CostRow[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/farm/cost-analysis");
        const d = await res.json();
        if (d.rows) setRows(d.rows);
        if (d.summary) setSummary(d.summary);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <TrendingUp size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма данни за анализ.</p>
        <p className="mt-1 text-xs">Добавете полета, инвентарни движения и записи за реколта.</p>
      </div>
    );
  }

  return (<>
    {summary && (
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо разходи</p>
          <p className="text-xl font-bold text-red-600">{summary.totalCost.toFixed(2)} лв</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Разход/дка (средно)</p>
          <p className="text-xl font-bold">{summary.weightedCostPerDecare.toFixed(2)} лв</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Разход/кг (средно)</p>
          <p className="text-xl font-bold">{summary.weightedCostPerUnit.toFixed(4)} лв</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Обща площ</p>
          <p className="text-xl font-bold">{summary.totalAreaDecares.toFixed(1)} дка</p>
        </div>
      </div>
    )}

    {summary && summary.cropBreakdown.length > 1 && (
      <div className="mb-4 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Sprout size={16} /> По култури</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr><th className="p-2">Култура</th><th className="p-2 text-right">Площ (дка)</th><th className="p-2 text-right">Добив</th><th className="p-2 text-right">Разход</th><th className="p-2 text-right">Разход/дка</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {summary.cropBreakdown.map((c) => (
                <tr key={c.crop} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2 font-bold">{c.crop}</td>
                  <td className="p-2 text-right font-mono">{c.area.toFixed(1)}</td>
                  <td className="p-2 text-right font-mono">{c.yield.toFixed(0)}</td>
                  <td className="p-2 text-right font-mono text-red-600">{c.cost.toFixed(2)} лв</td>
                  <td className="p-2 text-right font-mono">{(c.area > 0 ? c.cost / c.area : 0).toFixed(2)} лв</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
        <h2 className="flex items-center gap-2 font-bold"><TrendingUp size={18} className="text-emerald-600" /> Себестойност по полета</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
            <tr>
              <th className="p-3">Поле</th>
              <th className="p-3 text-right">дка</th>
              <th className="p-3 text-right">Добив</th>
              <th className="p-3 text-right"><Sprout size={12} className="inline" /> Семена</th>
              <th className="p-3 text-right"><Sprout size={12} className="inline" /> Торове</th>
              <th className="p-3 text-right"><Sprout size={12} className="inline" /> ПРЗ</th>
              <th className="p-3 text-right"><Fuel size={12} className="inline" /> Гориво</th>
              <th className="p-3 text-right"><Wrench size={12} className="inline" /> Сервиз</th>
              <th className="p-3 text-right">Други</th>
              <th className="p-3 text-right">Общо</th>
              <th className="p-3 text-right">лв/дка</th>
              <th className="p-3 text-right">лв/кг</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map((r) => (
              <tr key={r.fieldId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-bold">{r.fieldName}</td>
                <td className="p-3 text-right font-mono">{r.areaDecares.toFixed(1)}</td>
                <td className="p-3 text-right font-mono">{r.totalYield.toFixed(0)} <span className="text-xs text-slate-500">{r.yieldUnit}</span></td>
                <td className="p-3 text-right font-mono">{r.seedCost > 0 ? r.seedCost.toFixed(2) : "—"}</td>
                <td className="p-3 text-right font-mono">{r.fertilizerCost > 0 ? r.fertilizerCost.toFixed(2) : "—"}</td>
                <td className="p-3 text-right font-mono">{r.chemicalCost > 0 ? r.chemicalCost.toFixed(2) : "—"}</td>
                <td className="p-3 text-right font-mono">{r.fuelCost > 0 ? r.fuelCost.toFixed(2) : "—"}</td>
                <td className="p-3 text-right font-mono">{r.servicesCost > 0 ? r.servicesCost.toFixed(2) : "—"}</td>
                <td className="p-3 text-right font-mono">{r.otherCost > 0 ? r.otherCost.toFixed(2) : "—"}</td>
                <td className="p-3 text-right font-mono font-bold text-red-600">{r.totalCost.toFixed(2)}</td>
                <td className="p-3 text-right font-mono font-bold">{r.costPerDecare.toFixed(2)}</td>
                <td className="p-3 text-right font-mono">{r.costPerUnit.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>);
}

export default function RekoltaPage() {
  const [tab, setTab] = useState<"harvest" | "finance" | "cost">("harvest");

  return (
    <SitePageShell maxWidth="6xl" subheader={
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">Реколта и себестойност</p>
      </div>
    }>
      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button onClick={() => setTab("harvest")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "harvest" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <Combine size={16} /> Календар на жътва
        </button>
        <button onClick={() => setTab("finance")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "finance" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <DollarSign size={16} /> Финанси
        </button>
        <button onClick={() => setTab("cost")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "cost" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <TrendingDown size={16} /> Себестойност
        </button>
      </div>

      {tab === "harvest" && <HarvestTab />}
      {tab === "finance" && <FinanceTab />}
      {tab === "cost" && <CostAnalysisTab />}
    </SitePageShell>
  );
}
