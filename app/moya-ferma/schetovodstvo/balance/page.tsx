"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Loader2 } from "lucide-react";

type AccountRow = {
  accountNumber: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
};

export default function BalancePage() {
  const [tab, setTab] = useState<"balance" | "pnl" | "trial">("trial");
  const [trial, setTrial] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/accounting/reports?type=trial")
      .then((r) => r.json())
      .then((data) => { setTrial(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setTrial([]); setLoading(false); });
  }, []);

  const safeTrial = Array.isArray(trial) ? trial : [];
  const assets = safeTrial.filter((r) => r.accountType === "asset");
  const liabilities = safeTrial.filter((r) => r.accountType === "liability");
  const equity = safeTrial.filter((r) => r.accountType === "equity");
  const income = safeTrial.filter((r) => r.accountType === "income");
  const expenses = safeTrial.filter((r) => r.accountType === "expense");

  const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const totalEquity = equity.reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const totalIncome = income.reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const totalExpenses = expenses.reduce((s, a) => s + (a.balance || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setTab("trial")} className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${tab === "trial" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>Оборотна ведомост</button>
          <button onClick={() => setTab("balance")} className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${tab === "balance" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>Баланс</button>
          <button onClick={() => setTab("pnl")} className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${tab === "pnl" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>Печалба/Загуба</button>
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Финансови отчети</p>
      </div>
    }>
      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
      ) : tab === "trial" ? (
        <div className="glass-panel overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <BarChart3 size={18} className="text-teal-600" /> Оборотна ведомост
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Сметка</th><th className="p-3">Име</th><th className="p-3">Тип</th><th className="p-3 text-right">Дебит</th><th className="p-3 text-right">Кредит</th><th className="p-3 text-right">Салдо</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {safeTrial.map((r) => (
                  <tr key={r.accountNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs font-bold text-slate-600">{r.accountNumber}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{r.accountName}</td>
                    <td className="p-3 text-xs text-slate-500">{r.accountType === "asset" ? "Актив" : r.accountType === "liability" ? "Пасив" : r.accountType === "equity" ? "Капитал" : r.accountType === "income" ? "Приход" : "Разход"}</td>
                    <td className="p-3 text-right">{r.debit > 0 ? `${r.debit.toFixed(2)} €` : "—"}</td>
                    <td className="p-3 text-right">{r.credit > 0 ? `${r.credit.toFixed(2)} €` : "—"}</td>
                    <td className={`p-3 text-right font-bold ${r.balance > 0 ? "text-emerald-600" : r.balance < 0 ? "text-red-500" : ""}`}>{r.balance.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "balance" ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><TrendingUp size={18} className="text-emerald-600" /> Активи</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {assets.map((a) => (
                <div key={a.accountNumber} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span><span className="font-mono text-xs text-slate-500">{a.accountNumber}</span> {a.accountName}</span>
                  <span className="font-bold">{a.balance.toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-teal-50/80 px-5 py-3 text-sm font-bold dark:bg-teal-950/30">
                <span>Общо активи</span>
                <span className="text-emerald-700 dark:text-emerald-400">{totalAssets.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          <div>
            <div className="glass-panel overflow-hidden rounded-3xl mb-6">
              <div className="border-b border-white/10 bg-amber-50/50 p-5 dark:bg-amber-950/20">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><TrendingDown size={18} className="text-red-500" /> Пасиви</h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {liabilities.map((l) => (
                  <div key={l.accountNumber} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span><span className="font-mono text-xs text-slate-500">{l.accountNumber}</span> {l.accountName}</span>
                    <span className="font-bold">{Math.abs(l.balance).toFixed(2)} €</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-amber-50/80 px-5 py-3 text-sm font-bold dark:bg-amber-950/30">
                  <span>Общо пасиви</span>
                  <span className="text-amber-700 dark:text-amber-400">{totalLiabilities.toFixed(2)} €</span>
                </div>
              </div>
            </div>
            <div className="glass-panel overflow-hidden rounded-3xl">
              <div className="border-b border-white/10 bg-purple-50/50 p-5 dark:bg-purple-950/20">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><DollarSign size={18} className="text-purple-500" /> Капитал</h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {equity.map((e) => (
                  <div key={e.accountNumber} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span><span className="font-mono text-xs text-slate-500">{e.accountNumber}</span> {e.accountName}</span>
                    <span className="font-bold">{Math.abs(e.balance).toFixed(2)} €</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-purple-50/80 px-5 py-3 text-sm font-bold dark:bg-purple-950/30">
                  <span>Общо капитал</span>
                  <span className="text-purple-700 dark:text-purple-400">{totalEquity.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><FileText size={18} className="text-teal-600" /> Отчет за приходите и разходите</h2>
          </div>
          <div className="p-5">
            <h3 className="mb-3 font-bold text-emerald-700 dark:text-emerald-400">Приходи</h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700">
              {income.map((r) => (
                <div key={r.accountNumber} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span><span className="font-mono text-xs text-slate-500">{r.accountNumber}</span> {r.accountName}</span>
                  <span className="font-bold text-emerald-600">{Math.abs(r.balance).toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-emerald-50/80 px-4 py-2.5 text-sm font-bold dark:bg-emerald-950/30">
                <span>Общо приходи</span><span className="text-emerald-700 dark:text-emerald-400">{totalIncome.toFixed(2)} €</span>
              </div>
            </div>
            <h3 className="mb-3 mt-6 font-bold text-red-600 dark:text-red-400">Разходи</h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700">
              {expenses.map((r) => (
                <div key={r.accountNumber} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span><span className="font-mono text-xs text-slate-500">{r.accountNumber}</span> {r.accountName}</span>
                  <span className="font-bold text-red-600">{r.balance.toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-red-50/80 px-4 py-2.5 text-sm font-bold dark:bg-red-950/30">
                <span>Общо разходи</span><span className="text-red-700 dark:text-red-400">{totalExpenses.toFixed(2)} €</span>
              </div>
            </div>
            <div className={`mt-6 flex items-center justify-between rounded-2xl border p-5 text-lg font-bold ${netProfit >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"}`}>
              <span>{netProfit >= 0 ? "Нетна печалба" : "Нетна загуба"}</span>
              <span>{Math.abs(netProfit).toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
