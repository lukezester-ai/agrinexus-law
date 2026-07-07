"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Landmark, Plus, Save, Trash2, Search, X, FileText, Loader2, TrendingUp, TrendingDown } from "lucide-react";

type VatEntry = {
  id: string; type: "sales" | "purchase"; periodYear: number; periodMonth: number;
  entryDate: string; documentNumber: string; counterpartyName: string;
  counterpartyVat: string; invoiceNumber: string; invoiceDate: string;
  netAmount: number; vatAmount: number; totalAmount: number;
  vatRate: number; isIntraCommunity: boolean;
};

const MONTHS = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];

export default function DanaciPage() {
  const [entries, setEntries] = useState<VatEntry[]>([]);
  const [tab, setTab] = useState<"sales" | "purchase">("sales");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [form, setForm] = useState({
    counterpartyName: "", counterpartyVat: "", invoiceNumber: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    entryDate: new Date().toISOString().slice(0, 10),
    documentNumber: "", netAmount: 0, vatAmount: 0, totalAmount: 0, vatRate: 20, isIntraCommunity: false,
  });

  const loadVat = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: tab, year: String(filterYear), month: String(filterMonth + 1) });
    const res = await fetch(`/api/accounting/vat?${params}`);
    const data = await res.json();
    setEntries(data.map((e: any) => ({ ...e, netAmount: Number(e.netAmount), vatAmount: Number(e.vatAmount), totalAmount: Number(e.totalAmount), vatRate: Number(e.vatRate), isIntraCommunity: e.isIntraCommunity === "true" })));
    setLoading(false);
  };

  useEffect(() => { loadVat(); }, [tab, filterMonth, filterYear]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/accounting/vat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: tab, periodYear: filterYear, periodMonth: filterMonth + 1 }),
      });
      await loadVat();
      setShowForm(false);
      setForm({ counterpartyName: "", counterpartyVat: "", invoiceNumber: "", invoiceDate: new Date().toISOString().slice(0, 10), entryDate: new Date().toISOString().slice(0, 10), documentNumber: "", netAmount: 0, vatAmount: 0, totalAmount: 0, vatRate: 20, isIntraCommunity: false });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounting/vat/${id}`, { method: "DELETE" });
    await loadVat();
  };

  const filtered = entries.filter(
    (e) => (e.counterpartyName || "").toLowerCase().includes(search.toLowerCase()) ||
           (e.invoiceNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalNet = filtered.reduce((s, e) => s + e.netAmount, 0);
  const totalVat = filtered.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmt = filtered.reduce((s, e) => s + e.totalAmount, 0);

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Данъци и ДДС</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нов запис
        </button>
      </div>
    }>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button onClick={() => setTab("sales")} className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${tab === "sales" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
            <TrendingUp size={14} className="inline mr-1" /> Дневник продажби
          </button>
          <button onClick={() => setTab("purchase")} className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${tab === "purchase" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
            <TrendingDown size={14} className="inline mr-1" /> Дневник покупки
          </button>
        </div>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none dark:border-slate-700 dark:text-white">
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none dark:border-slate-700 dark:text-white">
          {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => window.open(`/api/accounting/vat/nap-export?year=${filterYear}&month=${filterMonth + 1}`, '_blank')} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300">
          <FileText size={16} /> Експорт XML
        </button>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Данъчна основа</p>
          <p className="text-xl font-bold">{totalNet.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">ДДС</p>
          <p className="text-xl font-bold text-amber-600">{totalVat.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо</p>
          <p className="text-xl font-bold">{totalAmt.toFixed(2)} €</p>
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
          <h3 className="mb-4 font-bold">Нов запис в ДДС дневник</h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Контрагент</label>
              <input value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ДДС номер</label>
              <input value={form.counterpartyVat} onChange={(e) => setForm({ ...form, counterpartyVat: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Фактура №</label>
              <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата на фактура</label>
              <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Данъчна основа (€)</label>
              <input type="number" step="0.01" value={form.netAmount || ""} onChange={(e) => {
                const net = Number(e.target.value); const vat = net * form.vatRate / 100;
                setForm({ ...form, netAmount: net, vatAmount: vat, totalAmount: net + vat });
              }} required className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ДДС ставка</label>
              <select value={form.vatRate} onChange={(e) => {
                const rate = Number(e.target.value); const vat = form.netAmount * rate / 100;
                setForm({ ...form, vatRate: rate, vatAmount: vat, totalAmount: form.netAmount + vat });
              }} className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value={0}>0%</option><option value={9}>9%</option><option value={20}>20%</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ic" checked={form.isIntraCommunity} onChange={(e) => setForm({ ...form, isIntraCommunity: e.target.checked })} className="rounded border-slate-300" />
              <label htmlFor="ic" className="text-sm">Вътреобщностна доставка</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Добави
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
          </div>
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Landmark size={18} className="text-teal-600" /> ДДС дневник {tab === "sales" ? "продажби" : "покупки"} — {MONTHS[filterMonth]} {filterYear}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500"><FileText size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма записи за този период.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Дата</th><th className="p-3">Фактура</th><th className="p-3">Контрагент</th><th className="p-3 text-right">Дан. основа</th><th className="p-3 text-right">ДДС</th><th className="p-3 text-right">Общо</th><th className="p-3 text-center">ВО</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-600 whitespace-nowrap">{e.entryDate?.slice(0, 10)}</td>
                    <td className="p-3 font-mono text-xs text-slate-500">{e.invoiceNumber}</td>
                    <td className="p-3">{e.counterpartyName}</td>
                    <td className="p-3 text-right">{e.netAmount.toFixed(2)} €</td>
                    <td className="p-3 text-right text-amber-600">{e.vatAmount.toFixed(2)} €</td>
                    <td className="p-3 text-right font-bold">{e.totalAmount.toFixed(2)} €</td>
                    <td className="p-3 text-center">{e.isIntraCommunity ? <span className="text-xs text-blue-600">ВО</span> : "—"}</td>
                    <td className="p-3"><button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button></td>
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
