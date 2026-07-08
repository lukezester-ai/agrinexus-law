"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { FileText, Plus, Save, Trash2, Edit, Search, X, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import LinkedDocuments from "@/components/linked-documents";

type InvoiceItem = { id: string; name: string; quantity: number; unitPrice: number; vatRate: number };

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEik: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "issued" | "paid";
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  notes: string;
};

function emptyItem(): InvoiceItem {
  return { id: crypto.randomUUID(), name: "", quantity: 1, unitPrice: 0, vatRate: 20 };
}

export default function SmetkiPage() {
  const [tab, setTab] = useState<"sales" | "purchase">("sales");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [form, setForm] = useState({
    clientName: "", clientEik: "", issueDate: new Date().toISOString().slice(0, 10), dueDate: "", vatRate: 20, notes: "",
  });

  const loadInvoices = async (type: string) => {
    setLoading(true);
    const endpoint = type === "sales" ? "/api/accounting/invoices" : "/api/accounting/purchases";
    const res = await fetch(endpoint);
    const data = await res.json();
    setInvoices(data.map((inv: any) => ({
      ...inv,
      subtotal: Number(inv.subtotal || inv.netAmount || 0),
      vatAmount: Number(inv.vatAmount || 0),
      totalAmount: Number(inv.totalAmount || 0),
      vatRate: Number(inv.vatRate || 20),
      items: inv.items || [],
      clientName: inv.clientName || inv.supplierName || "",
      clientEik: inv.clientEik || inv.supplierEik || "",
    })));
    setLoading(false);
  };

  useEffect(() => { loadInvoices(tab); }, [tab]);

  const startNew = () => {
    setEditing(null);
    setForm({ clientName: "", clientEik: "", issueDate: new Date().toISOString().slice(0, 10), dueDate: "", vatRate: 20, notes: "" });
    setItems([emptyItem()]);
    setShowForm(true);
  };

  const startEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({ clientName: inv.clientName, clientEik: inv.clientEik, issueDate: inv.issueDate.slice(0, 10), dueDate: inv.dueDate?.slice(0, 10) || "", vatRate: Number(inv.vatRate), notes: inv.notes || "" });
    setItems(inv.items.map((i) => ({ ...i })));
    setShowForm(true);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0);
  const totalAmount = subtotal + vatAmount;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.name && i.quantity > 0);
    if (validItems.length === 0) return;

    setSaving(true);
    const payload = {
      clientName: form.clientName,
      supplierName: form.clientName,
      clientEik: form.clientEik,
      supplierEik: form.clientEik,
      issueDate: form.issueDate,
      dueDate: form.dueDate || null,
      subtotal, vatAmount, totalAmount,
      vatRate: form.vatRate,
      netAmount: subtotal,
      items: validItems,
      notes: form.notes,
    };

    try {
      if (editing) {
        await fetch(`/api/accounting/${tab === "sales" ? "invoices" : "purchases"}/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/accounting/${tab === "sales" ? "invoices" : "purchases"}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      await loadInvoices(tab);
      setShowForm(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounting/${tab === "sales" ? "invoices" : "purchases"}/${id}`, { method: "DELETE" });
    await loadInvoices(tab);
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/accounting/${tab === "sales" ? "invoices" : "purchases"}/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    await loadInvoices(tab);
  };

  const totalSales = invoices.filter((i) => i.status !== "draft").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Фактури</p>
        <button onClick={startNew} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нова фактура
        </button>
      </div>
    }>
      <div className="mb-4 flex gap-3">
        <button onClick={() => setTab("sales")} className={`rounded-xl px-5 py-2 text-sm font-bold transition ${tab === "sales" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
          <ArrowUpRight size={14} className="inline mr-1" /> Продажби
        </button>
        <button onClick={() => setTab("purchase")} className={`rounded-xl px-5 py-2 text-sm font-bold transition ${tab === "purchase" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
          <ArrowDownRight size={14} className="inline mr-1" /> Покупки
        </button>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо фактури</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{invoices.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Издадени</p>
          <p className="text-xl font-bold text-emerald-600">{invoices.filter((i) => i.status !== "draft").length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Обща сума</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{totalSales.toFixed(2)} €</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по номер или клиент..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">{editing ? "Редактиране" : "Нова"} фактура {tab === "sales" ? "продажба" : "покупка"}</h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{tab === "sales" ? "Клиент" : "Доставчик"}</label>
              <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ЕИК</label>
              <input value={form.clientEik} onChange={(e) => setForm({ ...form, clientEik: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата</label>
              <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Падеж</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="p-2">Артикул</th>
                  <th className="p-2 w-20 text-right">К-во</th>
                  <th className="p-2 w-24 text-right">Цена</th>
                  <th className="p-2 w-16 text-right">ДДС %</th>
                  <th className="p-2 w-24 text-right">Сума</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2"><input value={item.name} onChange={(e) => { const n = [...items]; n[idx] = { ...item, name: e.target.value }; setItems(n); }} placeholder="Име" className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-xs outline-none dark:border-slate-700 dark:text-white" /></td>
                    <td className="p-2"><input type="number" step="0.01" value={item.quantity || ""} onChange={(e) => { const n = [...items]; n[idx] = { ...item, quantity: Number(e.target.value) }; setItems(n); }} className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-right text-xs outline-none dark:border-slate-700 dark:text-white" /></td>
                    <td className="p-2"><input type="number" step="0.01" value={item.unitPrice || ""} onChange={(e) => { const n = [...items]; n[idx] = { ...item, unitPrice: Number(e.target.value) }; setItems(n); }} className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-right text-xs outline-none dark:border-slate-700 dark:text-white" /></td>
                    <td className="p-2">
                      <select value={item.vatRate} onChange={(e) => { const n = [...items]; n[idx] = { ...item, vatRate: Number(e.target.value) }; setItems(n); }}
                        className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-xs outline-none dark:border-slate-700 dark:text-white">
                        <option value={0}>0%</option><option value={9}>9%</option><option value={20}>20%</option>
                      </select>
                    </td>
                    <td className="p-2 text-right text-xs font-bold">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                    <td className="p-2"><button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span>Основа: <strong>{subtotal.toFixed(2)} €</strong></span>
              <span className="ml-3">ДДС: <strong>{vatAmount.toFixed(2)} €</strong></span>
              <span className="ml-3">Общо: <strong className="text-emerald-600">{totalAmount.toFixed(2)} €</strong></span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Създай"}
              </button>
            </div>
          </div>
          {editing && <div className="mt-4"><LinkedDocuments module="invoices" entityId={editing.id} /></div>}
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <FileText size={18} className="text-teal-600" /> {tab === "sales" ? "Продажби" : "Покупки"} ({invoices.length})
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма фактури.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="p-3">Номер</th>
                  <th className="p-3">{tab === "sales" ? "Клиент" : "Доставчик"}</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3 text-right">Общо</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {invoices.filter((inv) => (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) || (inv.clientName || "").toLowerCase().includes(search.toLowerCase()))
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-xs text-slate-500">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-900 dark:text-white">{inv.clientName}</td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{inv.issueDate?.slice(0, 10)}</td>
                      <td className="p-3 text-right font-bold">{inv.totalAmount.toFixed(2)} €</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${inv.status === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : inv.status === "issued" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {inv.status === "paid" ? "Платена" : inv.status === "issued" ? "Издадена" : "Чернова"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          {inv.status === "draft" && <button onClick={() => handleStatus(inv.id, "issued")} className="text-xs text-blue-600 hover:text-blue-800 font-bold">Издай</button>}
                          {inv.status === "issued" && <button onClick={() => handleStatus(inv.id, "paid")} className="text-xs text-emerald-600 hover:text-emerald-800 font-bold">Плати</button>}
                          <button onClick={() => startEdit(inv)} className="text-teal-600 hover:text-teal-800"><Edit size={15} /></button>
                          <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
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
