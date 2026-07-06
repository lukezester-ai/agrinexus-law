"use client";

import { useState } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Landmark, Plus, FileText, Calculator, BarChart3, ArrowUpRight, ArrowDownRight, Bot } from "lucide-react";

type JournalEntry = {
  id: string;
  date: string;
  number: string;
  description: string;
  debit: number;
  credit: number;
  status: string;
};

const DEMO_ENTRIES: JournalEntry[] = [
  { id: "1", date: "2026-01-15", number: "2026-00001", description: "Наем офис", debit: 1200, credit: 0, status: "posted" },
  { id: "2", date: "2026-01-16", number: "2026-00002", description: "Електроенергия", debit: 245.50, credit: 0, status: "posted" },
  { id: "3", date: "2026-01-18", number: "2026-00003", description: "Продажба пшеница", debit: 0, credit: 5400, status: "posted" },
  { id: "4", date: "2026-01-20", number: "2026-00004", description: "Закупени торове", debit: 890, credit: 0, status: "draft" },
];

export default function SchetovodstvoPage() {
  const [entries] = useState<JournalEntry[]>(DEMO_ENTRIES);

  const totals = entries.reduce((acc, e) => ({
    debit: acc.debit + e.debit,
    credit: acc.credit + e.credit,
  }), { debit: 0, credit: 0 });

  return (
    <SitePageShell
      maxWidth="4xl"
      subheader={
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Счетоводство</p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowUpRight size={16} className="text-emerald-500" /> Приходи
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {totals.credit.toFixed(2)} €
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowDownRight size={16} className="text-red-500" /> Разходи
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {totals.debit.toFixed(2)} €
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <BarChart3 size={16} className="text-blue-500" /> Резултат
          </div>
          <p className={`mt-1 text-2xl font-bold ${totals.credit - totals.debit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {(totals.credit - totals.debit).toFixed(2)} €
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href="/moya-ferma/schetovodstvo/smetkovodstvo" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-100 p-3 dark:bg-teal-900/50">
              <FileText size={24} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Журнал</h3>
              <p className="text-xs text-slate-500">Счетоводни записи</p>
            </div>
          </div>
        </a>
        <a href="/moya-ferma/schetovodstvo/smetki" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/50">
              <Calculator size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Фактури</h3>
              <p className="text-xs text-slate-500">Продажби и покупки</p>
            </div>
          </div>
        </a>
        <a href="/moya-ferma/schetovodstvo/balance" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/50">
              <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Баланс и П&Л</h3>
              <p className="text-xs text-slate-500">Финансови отчети</p>
            </div>
          </div>
        </a>
        <a href="/moya-ferma/schetovodstvo/danaci" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/50">
              <Landmark size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Данъци и ДДС</h3>
              <p className="text-xs text-slate-500">Декларации и дневници</p>
            </div>
          </div>
        </a>
        <a href="/moya-ferma/schetovodstvo/ai" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700 sm:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">AI Счетоводен асистент</h3>
              <p className="text-xs text-slate-500">Задайте въпрос на естествен език — баланс, фактури, ДДС, анализи</p>
            </div>
          </div>
        </a>
      </div>

      <div className="mt-6 glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <FileText size={18} className="text-teal-600" /> Последни записи
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr>
                <th className="p-3">Дата</th>
                <th className="p-3">Номер</th>
                <th className="p-3">Описание</th>
                <th className="p-3 text-right">Дебит</th>
                <th className="p-3 text-right">Кредит</th>
                <th className="p-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 text-slate-600">{e.date}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{e.number}</td>
                  <td className="p-3 text-slate-900 dark:text-white">{e.description}</td>
                  <td className="p-3 text-right text-slate-900 dark:text-white">{e.debit > 0 ? `${e.debit.toFixed(2)} €` : "—"}</td>
                  <td className="p-3 text-right text-slate-900 dark:text-white">{e.credit > 0 ? `${e.credit.toFixed(2)} €` : "—"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.status === "posted" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {e.status === "posted" ? "Осчетоводено" : "Чернова"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SitePageShell>
  );
}
