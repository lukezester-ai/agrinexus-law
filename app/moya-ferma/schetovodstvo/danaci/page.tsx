"use client";

import { use, useCallback, useEffect, useState } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Landmark, Download, Send, CheckCircle, XCircle, Clock, RefreshCw, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: string;
  vatAmount: string;
  vatRate: string;
  type: string;
  status: string;
  napStatus: string;
  napUuid: string | null;
  napError: string | null;
  createdAt: string;
};

type VatSummary = {
  period: string;
  salesCount: number;
  salesTotal: number;
  salesVat: number;
  purchaseCount: number;
  purchaseTotal: number;
  purchaseVat: number;
};

export default function DanaciPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [summary, setSummary] = useState<VatSummary>({
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    salesCount: 0, salesTotal: 0, salesVat: 0,
    purchaseCount: 0, purchaseTotal: 0, purchaseVat: 0,
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/accounting/invoices");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const filtered = (data as Invoice[]).filter((inv) => inv.status !== "draft");
      setInvoices(filtered);

      const sales = filtered.filter((i) => i.type === "sales");
      const purchases = filtered.filter((i) => i.type !== "sales");
      setSummary({
        period: summary.period,
        salesCount: sales.length,
        salesTotal: sales.reduce((s, i) => s + Number(i.totalAmount), 0),
        salesVat: sales.reduce((s, i) => s + Number(i.vatAmount), 0),
        purchaseCount: purchases.length,
        purchaseTotal: purchases.reduce((s, i) => s + Number(i.totalAmount), 0),
        purchaseVat: purchases.reduce((s, i) => s + Number(i.vatAmount), 0),
      });
    } catch {
      setMessage({ type: "error", text: "Грешка при зареждане на фактурите" });
    } finally {
      setLoading(false);
    }
  }, [summary.period]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const submitToNap = async (invoiceId: string) => {
    setSubmitting(invoiceId);
    setMessage(null);
    try {
      const res = await fetch(`/api/accounting/vat/submit?invoiceId=${invoiceId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Фактурата е подадена към НАП" });
        fetchInvoices();
      } else {
        setMessage({ type: "error", text: data.error || "Грешка при подаване" });
      }
    } catch {
      setMessage({ type: "error", text: "Мрежова грешка" });
    } finally {
      setSubmitting(null);
    }
  };

  const downloadXml = () => {
    const [year, month] = summary.period.split("-");
    window.open(`/api/accounting/vat/nap-export?year=${year}&month=${month}`, "_blank");
  };

  const napStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800"><CheckCircle size={12} /> Подадена</span>;
      case "accepted":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"><CheckCircle size={12} /> Приета</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800"><XCircle size={12} /> Отхвърлена</span>;
      case "error":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800"><XCircle size={12} /> Грешка</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600"><Clock size={12} /> Неподадена</span>;
    }
  };

  return (
    <SitePageShell
      maxWidth="5xl"
      subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Данъци и ДДС</p>}
    >
      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowUpRight size={16} className="text-emerald-500" /> Продажби
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {summary.salesTotal.toFixed(2)} лв.
          </p>
          <p className="text-xs text-slate-400">ДДС: {summary.salesVat.toFixed(2)} лв. ({summary.salesCount} фактури)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowDownRight size={16} className="text-red-500" /> Покупки
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {summary.purchaseTotal.toFixed(2)} лв.
          </p>
          <p className="text-xs text-slate-400">ДДС: {summary.purchaseVat.toFixed(2)} лв. ({summary.purchaseCount} фактури)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Landmark size={16} className="text-amber-500" /> ДДС за внасяне
          </div>
          <p className={`mt-1 text-2xl font-bold ${summary.salesVat - summary.purchaseVat >= 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {Math.abs(summary.salesVat - summary.purchaseVat).toFixed(2)} лв.
          </p>
          <p className="text-xs text-slate-400">
            {summary.salesVat - summary.purchaseVat >= 0 ? "За плащане" : "За възстановяване"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={downloadXml} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">
          <Download size={16} /> Експорт XML за НАП
        </button>
        <span className="self-center text-xs text-slate-400">
          Период: {summary.period}
        </span>
      </div>

      <div className="mt-6 glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <FileText size={18} className="text-teal-600" /> Фактури — статус с НАП
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Зареждане...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Няма осчетоводени фактури</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="p-3">Номер</th>
                  <th className="p-3">Клиент</th>
                  <th className="p-3 text-right">Общо</th>
                  <th className="p-3 text-right">ДДС</th>
                  <th className="p-3">Статус НАП</th>
                  <th className="p-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs text-slate-600">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{inv.clientName || "—"}</td>
                    <td className="p-3 text-right text-slate-900 dark:text-white">{Number(inv.totalAmount).toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-600">{Number(inv.vatAmount).toFixed(2)}</td>
                    <td className="p-3">{napStatusBadge(inv.napStatus)}</td>
                    <td className="p-3">
                      {inv.napStatus === "not_submitted" || inv.napStatus === "error" ? (
                        <button
                          onClick={() => submitToNap(inv.id)}
                          disabled={submitting === inv.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
                        >
                          {submitting === inv.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                          {submitting === inv.id ? "..." : "Към НАП"}
                        </button>
                      ) : inv.napUuid ? (
                        <span className="text-xs text-slate-400">{inv.napUuid.slice(0, 8)}...</span>
                      ) : null}
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
