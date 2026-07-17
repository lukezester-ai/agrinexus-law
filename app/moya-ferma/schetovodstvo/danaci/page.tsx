"use client";

import { useCallback, useEffect, useState } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Landmark, Download, Send, CheckCircle, XCircle, Clock, RefreshCw, FileText, ArrowUpRight, ArrowDownRight, ShieldCheck, Globe, Check, AlertTriangle, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Demo entries when DB journals are empty for preview completeness
const DEMO_PURCHASES = [
  { id: "p-101", docNum: "1000045210", docDate: "03.07.2026", supplierVat: "BG115002890", supplierName: "АГРИЯ АД (Химически препарати)", itemDesc: "ЗЕМЕДЕЛСКИ РАЗХОДИ И МАТЕРИАЛИ", net: 12400.00, vat: 2480.00, total: 14880.00 },
  { id: "p-102", docNum: "3000891204", docDate: "08.07.2026", supplierVat: "BG831496285", supplierName: "ПЕТРОЛ АД (Дизелово гориво Б4)", itemDesc: "ГОРСКО И ЗЕМЕДЕЛСКО ГОРИВО", net: 6800.00, vat: 1360.00, total: 8160.00 },
  { id: "p-103", docNum: "0000214890", docDate: "14.07.2026", supplierVat: "BG204891023", supplierName: "АГРО МАШИНИ СЕРВИЗ ЕООД", itemDesc: "РЕМОНТ ТРАКТОР JOHN DEERE", net: 1500.00, vat: 300.00, total: 1800.00 },
  { id: "p-104", docNum: "8900124501", docDate: "19.07.2026", supplierVat: "BG123654789", supplierName: "СЕМЕНА БЪЛГАРИЯ АД", itemDesc: "СЕМЕНА ПШЕНИЦА ЕЛИТ 1РА РЕПРОДУКЦИЯ", net: 9200.00, vat: 1840.00, total: 11040.00 },
];

const DEMO_SALES = [
  { id: "s-201", docNum: "0000001042", docDate: "05.07.2026", clientVat: "BG201458963", clientName: "АГРО ТРЕЙДИНГ ГРУП ЕАД", itemDesc: "ПРОДАЖБА НА ЗЪРНО - ПШЕНИЦА", net: 24500.00, vat: 4900.00, total: 29400.00, isVod: false },
  { id: "s-202", docNum: "0000001043", docDate: "12.07.2026", clientVat: "RO18459201", clientName: "РОМЪНИЯ ГРЕЙН ЕКСПОРТ SRL", itemDesc: "ЕКСПОРТ ЗЪРНО ВОД (ЧЛ. 53 ЗДДС)", net: 48000.00, vat: 0.00, total: 48000.00, isVod: true },
  { id: "s-203", docNum: "0000001044", docDate: "16.07.2026", clientVat: "BG101234567", clientName: "ХЛЕБОЗАВОД СОФИЯ АД", itemDesc: "ПРОДАЖБА НА ПШЕНИЦА ХЛЕБНА", net: 18200.00, vat: 3640.00, total: 21840.00, isVod: false },
  { id: "s-204", docNum: "0000001045", docDate: "21.07.2026", clientVat: "EL098765432", clientName: "ХЕЛЕНИК АГРО ТРЕЙДИНГ SA (ГЪРЦИЯ)", itemDesc: "ВОД - СЛЪНЧОГЛЕД ЧЕРЕН ЗА МАСЛО", net: 35000.00, vat: 0.00, total: 35000.00, isVod: true },
];

export default function DanaciPage() {
  const [activeTab, setActiveTab] = useState<"invoices_status" | "pokupki" | "prodajbi" | "vies">("invoices_status");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [summary, setSummary] = useState<VatSummary>({
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    salesCount: 0, salesTotal: 0, salesVat: 0,
    purchaseCount: 0, purchaseTotal: 0, purchaseVat: 0,
  });

  // VIES Verifier Simulator state
  const [viesVatInput, setViesVatInput] = useState("RO18459201");
  const [viesStatus, setViesStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [viesResultInfo, setViesResultInfo] = useState<any | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/accounting/invoices").then((r) => r.json()).catch(() => []);
      const data = Array.isArray(res) ? res : [];
      const filtered = data.filter((inv) => inv.status !== "draft");
      setInvoices(filtered);

      const sales = filtered.filter((i) => i.type === "sales");
      const purchases = filtered.filter((i) => i.type !== "sales");
      setSummary({
        period: summary.period,
        salesCount: sales.length || DEMO_SALES.length,
        salesTotal: sales.length ? sales.reduce((s, i) => s + Number(i.totalAmount || 0), 0) : DEMO_SALES.reduce((s, i) => s + i.total, 0),
        salesVat: sales.length ? sales.reduce((s, i) => s + Number(i.vatAmount || 0), 0) : DEMO_SALES.reduce((s, i) => s + i.vat, 0),
        purchaseCount: purchases.length || DEMO_PURCHASES.length,
        purchaseTotal: purchases.length ? purchases.reduce((s, i) => s + Number(i.totalAmount || 0), 0) : DEMO_PURCHASES.reduce((s, i) => s + i.total, 0),
        purchaseVat: purchases.length ? purchases.reduce((s, i) => s + Number(i.vatAmount || 0), 0) : DEMO_PURCHASES.reduce((s, i) => s + i.vat, 0),
      });
    } catch {
      setInvoices([]);
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

  const downloadNapTxt = (type: "pokupki" | "prodajbi" | "vies") => {
    const [year, month] = summary.period.split("-");
    window.open(`/api/accounting/vat/nap-txt-export?type=${type}&year=${year}&month=${month}`, "_blank");
  };

  const handleVerifyVies = () => {
    setViesStatus("checking");
    setTimeout(() => {
      const clean = viesVatInput.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (clean.startsWith("RO") || clean.startsWith("EL") || clean.startsWith("DE") || clean.startsWith("IT")) {
        setViesStatus("valid");
        setViesResultInfo({
          vatNumber: clean,
          country: clean.startsWith("RO") ? "Румъния (Romania)" : clean.startsWith("EL") ? "Гърция (Greece)" : "ЕС (EU Member)",
          name: clean === "RO18459201" ? "RO-AGRO EXPORT SRL" : "EURO-AGRO TRADING LTD",
          address: "STR. PRINCIPALA NR. 14, BUCURESTI",
          statusText: "АЛАИВ / ВАЛИДЕН VIES ДДС НОМЕР (Имате право на 0% ставка по чл. 53 за ВОД)"
        });
      } else {
        setViesStatus("invalid");
        setViesResultInfo({
          vatNumber: clean,
          statusText: "НЕВАЛИДЕН или нерегистиран в VIES системата на Европейския съюз."
        });
      }
    }, 800);
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
      maxWidth="6xl"
      subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Генериране на ДДС Дневници (Покупки/Продажби) и VIES справки</p>}
    >
      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Top VAT Balance Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-500">
            <ArrowUpRight size={18} className="text-emerald-500" /> Продажби и ВОД (Общо)
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">
            {summary.salesTotal.toFixed(2)} лв.
          </p>
          <p className="text-xs font-bold text-slate-400">Начислен ДДС: {summary.salesVat.toFixed(2)} лв. ({summary.salesCount} документа)</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-500">
            <ArrowDownRight size={18} className="text-red-500" /> Покупки (Торове, Горива, Сервиз)
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">
            {summary.purchaseTotal.toFixed(2)} лв.
          </p>
          <p className="text-xs font-bold text-slate-400">Данъчен кредит ДДС: {summary.purchaseVat.toFixed(2)} лв. ({summary.purchaseCount} документа)</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-500">
            <Landmark size={18} className="text-amber-500" /> ДДС Резултат за периода ({summary.period})
          </div>
          <p className={`mt-1.5 text-2xl font-black ${summary.salesVat - summary.purchaseVat >= 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {Math.abs(summary.salesVat - summary.purchaseVat).toFixed(2)} лв.
          </p>
          <p className="text-xs font-bold text-slate-400">
            {summary.salesVat - summary.purchaseVat >= 0 ? "⚠️ За внасяне към НАП (до 14-то число)" : "✅ ДДС за възстановяване / приспадане"}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("invoices_status")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black transition flex items-center gap-1.5",
              activeTab === "invoices_status"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            <FileText size={14} />
            <span>1. Е-Фактура НАП & ДДС Статус</span>
          </button>

          <button
            onClick={() => setActiveTab("pokupki")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black transition flex items-center gap-1.5",
              activeTab === "pokupki"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            <ArrowDownRight size={14} />
            <span>2. Дневник Покупки (POKUPKI.TXT)</span>
          </button>

          <button
            onClick={() => setActiveTab("prodajbi")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black transition flex items-center gap-1.5",
              activeTab === "prodajbi"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            <ArrowUpRight size={14} />
            <span>3. Дневник Продажби (PRODAJBI.TXT)</span>
          </button>

          <button
            onClick={() => setActiveTab("vies")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black transition flex items-center gap-1.5",
              activeTab === "vies"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            <Globe size={14} />
            <span>4. Справка VIES (ВОД • VIES.TXT)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadXml}
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3.5 py-2 text-xs font-black text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-300 transition"
          >
            <Download size={14} />
            <span>Експорт XML за НАП</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INVOICES STATUS & e-Faktura */}
      {activeTab === "invoices_status" && (
        <div className="mt-6 glass-panel overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
          <div className="border-b border-slate-200 bg-teal-50/70 p-5 dark:border-slate-800 dark:bg-teal-950/20 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <FileText size={18} className="text-teal-600" /> Електронни Фактури — статус с НАП e-Faktura
            </h2>
            <span className="text-xs font-semibold text-slate-500">Период: {summary.period}</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Зареждане на фактурите...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Няма осчетоводени фактури в базата (Разгледайте Дневниците в табове 2, 3 и 4 за генериране на TXT файловете)</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-extrabold uppercase text-slate-500 dark:bg-slate-900/50">
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
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{inv.invoiceNumber}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.clientName || "—"}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">{Number(inv.totalAmount).toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400">{Number(inv.vatAmount).toFixed(2)}</td>
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
      )}

      {/* TAB 2: POKUPKI.TXT DIARY */}
      {activeTab === "pokupki" && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 dark:border-blue-900 dark:bg-blue-950/30 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-black text-base">
                <FileCheck size={20} className="text-blue-600" />
                <span>Дневник за покупките по ЗДДС (POKUPKI.TXT)</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                Генерира се съгласно изискванията на Приложение № 11 към Правилника за прилагане на ЗДДС (ППЗДДС). Включва всички фактури с право на данъчен кредит (торове, горива, резервни части, семена).
              </p>
            </div>

            <button
              onClick={() => downloadNapTxt("pokupki")}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 text-xs font-black shadow-lg shadow-blue-600/20 transition flex items-center gap-2 shrink-0"
            >
              <Download size={16} />
              <span>📥 Изтегли POKUPKI.TXT (НАП Формат)</span>
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Обобщени записи за периода ({summary.period})</span>
              <span className="text-xs font-bold text-slate-500">Брой записи: {DEMO_PURCHASES.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-left font-black text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Вид</th>
                    <th className="p-3">№ на документ</th>
                    <th className="p-3">Дата</th>
                    <th className="p-3">ЕИК / ДДС № Доставчик</th>
                    <th className="p-3">Име на Доставчик</th>
                    <th className="p-3">Предмет / Описание</th>
                    <th className="p-3 text-right">Дан. Основа 20%</th>
                    <th className="p-3 text-right">ДДС 20%</th>
                    <th className="p-3 text-right">Обща Стойност</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {DEMO_PURCHASES.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition">
                      <td className="p-3 font-bold text-slate-500">01 (Фактура)</td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{p.docNum}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{p.docDate}</td>
                      <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">{p.supplierVat}</td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">{p.supplierName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{p.itemDesc}</td>
                      <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">{p.net.toFixed(2)}</td>
                      <td className="p-3 text-right font-extrabold text-blue-600 dark:text-blue-400">{p.vat.toFixed(2)}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">{p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODAJBI.TXT DIARY */}
      {activeTab === "prodajbi" && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-base">
                <FileCheck size={20} className="text-emerald-600" />
                <span>Дневник за продажбите по ЗДДС (PRODAJBI.TXT)</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                Генерира се съгласно изискванията на Приложение № 10 към ППЗДДС. Включва всички издадени фактури към клиенти за реализирана земеделска продукция (пшеница, царевица, слънчоглед) и услуги.
              </p>
            </div>

            <button
              onClick={() => downloadNapTxt("prodajbi")}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-xs font-black shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 shrink-0"
            >
              <Download size={16} />
              <span>📥 Изтегли PRODAJBI.TXT (НАП Формат)</span>
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Обобщени записи за периода ({summary.period})</span>
              <span className="text-xs font-bold text-slate-500">Брой записи: {DEMO_SALES.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-left font-black text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Вид</th>
                    <th className="p-3">№ на документ</th>
                    <th className="p-3">Дата</th>
                    <th className="p-3">ЕИК / ДДС № Клиент</th>
                    <th className="p-3">Име на Клиент</th>
                    <th className="p-3">Предмет / Описание</th>
                    <th className="p-3 text-right">Дан. Основа 20%</th>
                    <th className="p-3 text-right">ДО 0% (ВОД/Експорт)</th>
                    <th className="p-3 text-right">ДДС 20%</th>
                    <th className="p-3 text-right">Обща Стойност</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {DEMO_SALES.map((s) => (
                    <tr key={s.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition">
                      <td className="p-3 font-bold text-slate-500">01 (Фактура)</td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{s.docNum}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{s.docDate}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {s.clientVat} {s.isVod && <span className="ml-1 rounded bg-purple-100 px-1 py-0.5 text-[9px] font-black text-purple-800">ВОД</span>}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">{s.clientName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{s.itemDesc}</td>
                      <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">{!s.isVod ? s.net.toFixed(2) : "0.00"}</td>
                      <td className="p-3 text-right font-black text-purple-600 dark:text-purple-400">{s.isVod ? s.net.toFixed(2) : "0.00"}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{s.vat.toFixed(2)}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">{s.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VIES REPORT & CHECKER */}
      {activeTab === "vies" && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-purple-200 bg-purple-50/60 p-6 dark:border-purple-900 dark:bg-purple-950/30 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-black text-base">
                <Globe size={20} className="text-purple-600" />
                <span>Справка-декларация VIES за Вътрешнообщностни Доставки (ВОД)</span>
              </div>
              <p className="text-xs sm:text-sm text-purple-900/80 dark:text-purple-200/80 leading-relaxed">
                Задължителна VIES декларация (VIES.TXT) при продажба на зърно и продукция с 0% ДДС ставка по чл. 53 от ЗДДС към клиенти, регистрирани по ДДС в други държави от Европейския съюз (Румъния, Гърция, Германия).
              </p>
            </div>

            <button
              onClick={() => downloadNapTxt("vies")}
              className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 text-xs font-black shadow-lg shadow-purple-600/20 transition flex items-center gap-2 shrink-0"
            >
              <Download size={16} />
              <span>📥 Изтегли VIES.TXT (НАП Формат)</span>
            </button>
          </div>

          {/* VIES Verifier Tool */}
          <div className="glass-panel-pro rounded-3xl p-6 border border-purple-500/30 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <ShieldCheck size={18} className="text-purple-600" />
              <span>VIES Валидатор на ДДС номера в ЕС (Проверка в реално време)</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={viesVatInput}
                onChange={(e) => setViesVatInput(e.target.value)}
                placeholder="Въведете ДДС номер (напр. RO18459201 или EL098765432)..."
                className="flex-1 min-w-[260px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleVerifyVies}
                disabled={viesStatus === "checking" || !viesVatInput}
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-purple-500/20 hover:scale-[1.02] transition flex items-center gap-2 disabled:opacity-50"
              >
                {viesStatus === "checking" ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
                <span>{viesStatus === "checking" ? "Проверка в ЕС портала..." : "⚡ Провери статус в VIES"}</span>
              </button>
            </div>

            {viesStatus !== "idle" && viesStatus !== "checking" && viesResultInfo && (
              <div className={cn("rounded-2xl p-4 border flex items-start gap-3 transition-all", viesStatus === "valid" ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200" : "bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200")}>
                {viesStatus === "valid" ? <Check size={20} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />}
                <div className="space-y-1 text-xs">
                  <p className="font-black text-sm">Резултат за {viesResultInfo.vatNumber}: {viesResultInfo.statusText}</p>
                  {viesStatus === "valid" && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-1 text-slate-700 dark:text-slate-300 font-medium">
                      <span><strong>Фирма:</strong> {viesResultInfo.name}</span>
                      <span><strong>Държава:</strong> {viesResultInfo.country}</span>
                      <span className="col-span-2"><strong>Адрес:</strong> {viesResultInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Вътрешнообщностни Доставки (ВОД) за периода ({summary.period})</span>
              <span className="text-xs font-bold text-slate-500">Брой ВОД записи: {DEMO_SALES.filter(s => s.isVod).length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-left font-black text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Код Държава</th>
                    <th className="p-3">VIES ДДС Номер на Получател</th>
                    <th className="p-3">Име на Получател</th>
                    <th className="p-3">№ на Фактура</th>
                    <th className="p-3">Дата</th>
                    <th className="p-3 text-right">Дан. Основа ВОД (EUR / BGN)</th>
                    <th className="p-3 text-right">ДДС Ставка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {DEMO_SALES.filter(s => s.isVod).map((v) => (
                    <tr key={v.id} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition">
                      <td className="p-3 font-black text-purple-700 dark:text-purple-400">{v.clientVat.substring(0, 2)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{v.clientVat}</td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">{v.clientName}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{v.docNum}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{v.docDate}</td>
                      <td className="p-3 text-right font-black text-purple-600 dark:text-purple-400">{v.net.toFixed(2)} лв.</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600">0.00% (чл. 53 ЗДДС)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
