"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Landmark, Plus, Trash2, Loader2, ArrowUpRight, ArrowDownRight, Upload } from "lucide-react";

type BankAccount = {
  id: string; name: string; institutionName: string | null; iban: string | null;
  balance: number; currency: string; isActive: string;
};

type BankTransaction = {
  id: string; accountId: string; amount: number; currency: string;
  date: string; description: string | null; counterpartyName: string | null;
  counterpartyIban: string | null; isReconciled: string; matchStatus: string;
  accountName: string | null;
};

export default function BankiPage() {
  const [tab, setTab] = useState<"accounts" | "transactions">("accounts");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accForm, setAccForm] = useState({ name: "", institutionName: "", iban: "", balance: "", currency: "BGN" });

  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm] = useState({ accountId: "", amount: "", date: "", description: "", counterpartyName: "" });

  const [showImportForm, setShowImportForm] = useState(false);
  const [importForm, setImportForm] = useState({ accountId: "", csvData: "", format: "csv" });
  const [importResult, setImportResult] = useState<string | null>(null);

  const loadAccounts = async () => {
    try { const r = await fetch("/api/farm/bank-accounts"); const d = await r.json(); setAccounts(Array.isArray(d) ? d : []); }
    catch { setAccounts([]); }
  };

  const loadTransactions = async (accountId?: string) => {
    try {
      const url = accountId ? `/api/farm/bank-transactions?accountId=${accountId}` : "/api/farm/bank-transactions";
      const r = await fetch(url); const d = await r.json(); setTransactions(Array.isArray(d) ? d : []);
    } catch { setTransactions([]); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadAccounts(), loadTransactions()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "transactions") loadTransactions(selectedAccountId || undefined);
  }, [tab, selectedAccountId]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/farm/bank-accounts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accForm.name, institutionName: accForm.institutionName || null, iban: accForm.iban || null, balance: accForm.balance || "0", currency: accForm.currency }),
      });
      await loadAccounts(); setShowAccountForm(false);
      setAccForm({ name: "", institutionName: "", iban: "", balance: "", currency: "BGN" });
    } finally { setSaving(false); }
  };

  const handleDeleteAccount = async (id: string) => {
    await fetch(`/api/farm/bank-accounts/${id}`, { method: "DELETE" });
    await loadAccounts();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/farm/bank-transactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: txForm.accountId, amount: txForm.amount, date: txForm.date, description: txForm.description || null, counterpartyName: txForm.counterpartyName || null }),
      });
      await loadTransactions(selectedAccountId || undefined); setShowTxForm(false);
      setTxForm({ accountId: "", amount: "", date: "", description: "", counterpartyName: "" });
    } finally { setSaving(false); }
  };

  const handleDeleteTransaction = async (id: string) => {
    await fetch(`/api/farm/bank-transactions/${id}`, { method: "DELETE" });
    await loadTransactions(selectedAccountId || undefined);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setImportResult(null);
    try {
      const r = await fetch("/api/farm/bank-transactions/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: importForm.accountId, fileContent: importForm.csvData, format: importForm.format }),
      });
      const data = await r.json();
      if (r.ok && data.summary) {
        setImportResult(`Успешен импорт! Засечени: ${data.summary.matched} | Частични: ${data.summary.partial} | Незасечени: ${data.summary.unmatched}`);
        await loadTransactions(selectedAccountId || undefined);
        await loadAccounts();
        setImportForm({ ...importForm, csvData: "" });
      } else {
        setImportResult(`Грешка: ${data.error || "Неуспешен импорт"}`);
      }
    } catch { setImportResult("Грешка при комуникация със сървъра."); }
    finally { setSaving(false); }
  };

  return (
    <SitePageShell maxWidth="7xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Банки</p>
        <div className="flex gap-2">
          <button onClick={() => { setTab("accounts"); setShowAccountForm(!showAccountForm); }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <Plus size={16} /> Добави сметка
          </button>
          <button onClick={() => { setTab("transactions"); setShowTxForm(!showTxForm); }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
            <Plus size={16} /> Добави транзакция
          </button>
          <button onClick={() => { setTab("transactions"); setShowImportForm(!showImportForm); }}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">
            <Upload size={16} /> Импорт
          </button>
        </div>
      </div>
    }>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("accounts")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "accounts" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
          <Landmark size={16} className="mr-1.5 inline" /> Сметки
        </button>
        <button onClick={() => setTab("transactions")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "transactions" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
          <ArrowUpRight size={16} className="mr-1.5 inline" /> Транзакции
        </button>
      </div>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium">
            <Landmark className="text-teal-600 dark:text-teal-400" /> {tab === "accounts" ? "Банкови сметки" : "Транзакции"}
          </h1>
        </div>

        {tab === "accounts" && showAccountForm && (
          <form onSubmit={handleAddAccount} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име на сметката</label>
              <input value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Институция</label>
              <input value={accForm.institutionName} onChange={(e) => setAccForm({ ...accForm, institutionName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">IBAN</label>
              <input value={accForm.iban} onChange={(e) => setAccForm({ ...accForm, iban: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Начално салдо</label>
              <input type="number" step="0.01" value={accForm.balance} onChange={(e) => setAccForm({ ...accForm, balance: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Валута</label>
              <select value={accForm.currency} onChange={(e) => setAccForm({ ...accForm, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="BGN">BGN</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Добави
              </button>
              <button type="button" onClick={() => setShowAccountForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {tab === "transactions" && showTxForm && (
          <form onSubmit={handleAddTransaction} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Сметка</label>
              <select value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">Избери сметка</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Сума</label>
              <input type="number" step="0.01" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата</label>
              <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
              <input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Контрагент</label>
              <input value={txForm.counterpartyName} onChange={(e) => setTxForm({ ...txForm, counterpartyName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Добави
              </button>
              <button type="button" onClick={() => setShowTxForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {tab === "transactions" && showImportForm && (
          <form onSubmit={handleImport} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Сметка</label>
                <select value={importForm.accountId} onChange={(e) => setImportForm({ ...importForm, accountId: e.target.value })} required
                  className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                  <option value="">Избери сметка</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Формат на извлечението</label>
                <select value={importForm.format} onChange={(e) => setImportForm({ ...importForm, format: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                  <option value="csv">CSV / Excel експорт (Банка ДСК, UniCredit, Fibank и др.)</option>
                  <option value="mt940">MT940 SWIFT стандарт</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Данни от извлечението (поставете съдържанието на файла тук)
              </label>
              <textarea value={importForm.csvData} onChange={(e) => setImportForm({ ...importForm, csvData: e.target.value })}
                rows={8} placeholder={importForm.format === "mt940" ? ":61:2607170717CD1250,00NTRFNONREF\n:86:/IBAN/BG12UNCR1234567890/NAME/Иван Иванов OOD\nФАКТУРА #10023" : "2026-07-15;1500.00;BGN;Иван Иванов;BG12UNCR1234567890;Плащане фактура #10023"}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            {importResult && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm font-bold text-teal-800 dark:border-teal-800/50 dark:bg-teal-900/30 dark:text-teal-300">
                {importResult}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Импортирай
              </button>
              <button type="button" onClick={() => setShowImportForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : tab === "accounts" ? (
          accounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500"><Landmark size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма банкови сметки.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                  <tr><th className="p-3">Сметка</th><th className="p-3">Институция</th><th className="p-3">IBAN</th><th className="p-3 text-right">Салдо</th><th className="p-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{a.name}</td>
                      <td className="p-3 text-slate-600">{a.institutionName || "—"}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{a.iban || "—"}</td>
                      <td className={`p-3 text-right font-bold ${a.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {a.balance.toFixed(2)} {a.currency}
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteAccount(a.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <>
            <div className="border-b border-slate-200 p-4 dark:border-slate-700">
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">Всички сметки</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500"><ArrowUpRight size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма транзакции.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                    <tr><th className="p-3">Дата</th><th className="p-3">Описание</th><th className="p-3">Контрагент</th><th className="p-3">Сметка</th><th className="p-3 text-right">Сума</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-slate-600">{new Date(t.date).toLocaleDateString("bg-BG")}</td>
                        <td className="p-3 font-medium">{t.description || "—"}</td>
                        <td className="p-3 text-slate-600">{t.counterpartyName || "—"}</td>
                        <td className="p-3 text-xs text-slate-500">{t.accountName || "—"}</td>
                        <td className={`p-3 text-right font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          <span className="inline-flex items-center gap-1">
                            {t.amount >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(t.amount).toFixed(2)} {t.currency}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            t.matchStatus === "matched" || t.isReconciled === "true"
                              ? "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300"
                              : t.matchStatus === "partial"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                          }`}>
                            {t.matchStatus === "matched" || t.isReconciled === "true"
                              ? "✅ Засечена"
                              : t.matchStatus === "partial"
                              ? "🔸 Частично"
                              : "⚠️ Незасечена"}
                          </span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => handleDeleteTransaction(t.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </SitePageShell>
  );
}
