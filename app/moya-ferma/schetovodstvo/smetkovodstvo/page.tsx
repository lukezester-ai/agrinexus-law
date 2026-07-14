"use client"

import { useEffect, useState } from "react"
import { SitePageShell } from "@/components/site-page-shell"
import { FileText, Plus, Save, Trash2, Edit, Search, X, Loader2, BookOpen, ListOrdered } from "lucide-react"

type Account = { id: string; accountNumber: string; name: string; type: string; isActive: boolean; isAnalytical: boolean }

type JournalLine = {
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  entryType: "debit" | "credit"
  amount: number
  description: string
}

type JournalEntry = {
  id: string
  journalNumber: string
  entryDate: string
  description: string
  documentType: string
  status: "draft" | "posted"
  lines: JournalLine[]
  createdAt: string
}

function emptyLine(): JournalLine {
  return { id: crypto.randomUUID(), accountId: "", accountNumber: "", accountName: "", entryType: "debit", amount: 0, description: "" }
}

function AccountPlanTab({ accounts: initial, onRefresh }: { accounts: Account[]; onRefresh: () => void }) {
  const [items, setItems] = useState<Account[]>(Array.isArray(initial) ? initial : [])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ accountNumber: "", name: "", type: "expense", isActive: true, isAnalytical: false })

  useEffect(() => { setItems(Array.isArray(initial) ? initial : []) }, [initial])

  const filtered = (Array.isArray(items) ? items : []).filter((a) => {
    const q = search.toLowerCase()
    return !q || a.accountNumber?.includes(q) || a.name?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q)
  })

  const startNew = () => {
    setEditing(null)
    setForm({ accountNumber: "", name: "", type: "expense", isActive: true, isAnalytical: false })
    setShowForm(true)
  }

  const startEdit = (item: Account) => {
    setEditing(item)
    setForm({ accountNumber: item.accountNumber, name: item.name, type: item.type, isActive: item.isActive, isAnalytical: item.isAnalytical })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accountNumber.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/accounting/accounts`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      } else {
        await fetch("/api/accounting/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      onRefresh()
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте?")) return
    await fetch(`/api/accounting/accounts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    onRefresh()
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по номер, име или тип..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
        <button onClick={startNew} className="flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700">
          <Plus size={14} /> Нова сметка
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">{editing ? "Редактиране" : "Нова"} сметка</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Номер *</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Име *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Тип</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white">
                <option value="asset">Актив</option>
                <option value="liability">Пасив</option>
                <option value="equity">Капитал</option>
                <option value="revenue">Приход</option>
                <option value="expense">Разход</option>
              </select>
            </div>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Активна
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isAnalytical} onChange={(e) => setForm({ ...form, isAnalytical: e.target.checked })} />
                Аналитична
              </label>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {editing ? "Запази" : "Създай"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
            <tr>
              <th className="p-2 w-20">Номер</th>
              <th className="p-2">Име</th>
              <th className="p-2 w-24">Тип</th>
              <th className="p-2 w-20 text-center">Активна</th>
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-2 font-mono text-xs font-bold text-slate-900 dark:text-white">{a.accountNumber}</td>
                <td className="p-2 text-slate-800 dark:text-slate-200">
                  {a.name}
                  {a.isAnalytical && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">анал</span>}
                </td>
                <td className="p-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    a.type === "asset" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                    : a.type === "liability" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                    : a.type === "equity" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                    : a.type === "revenue" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                  }`}>{a.type}</span>
                </td>
                <td className="p-2 text-center">
                  <span className={a.isActive ? "text-emerald-500" : "text-slate-300"}>{a.isActive ? "✓" : "✗"}</span>
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(a)} className="text-teal-600 hover:text-teal-800"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">Няма сметки.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SmetkovodstvoPage() {
  const [tab, setTab] = useState<"plan" | "journal">("plan")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()])
  const [formDate, setFormDate] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formDocType, setFormDocType] = useState("manual")

  const loadAll = async () => {
    try {
      const [entriesData, accountsData] = await Promise.all([
        fetch("/api/accounting/journal").then((r) => r.json()).catch(() => []),
        fetch("/api/accounting/accounts").then((r) => r.json()).catch(() => []),
      ])
      setEntries(Array.isArray(entriesData) ? entriesData : [])
      setAccounts(Array.isArray(accountsData) ? accountsData : [])
    } catch (e) {
      setEntries([])
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const reload = async () => {
    try {
      const res = await fetch("/api/accounting/journal").then((r) => r.json()).catch(() => [])
      setEntries(Array.isArray(res) ? res : [])
    } catch (e) {
      setEntries([])
    }
  }

  const startNew = () => {
    setEditing(null)
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormDesc("")
    setFormDocType("manual")
    setLines([emptyLine(), emptyLine()])
    setShowForm(true)
  }

  const startEdit = (entry: JournalEntry) => {
    setEditing(entry)
    setFormDate(entry.entryDate.slice(0, 10))
    setFormDesc(entry.description)
    setFormDocType(entry.documentType)
    setLines(entry.lines.map((l) => ({ ...l })))
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const validLines = lines.filter((l) => l.accountId && l.amount > 0)
    if (validLines.length < 2) return

    const totalDebit = validLines.filter((l) => l.entryType === "debit").reduce((s, l) => s + l.amount, 0)
    const totalCredit = validLines.filter((l) => l.entryType === "credit").reduce((s, l) => s + l.amount, 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) return

    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/accounting/journal/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryDate: formDate, description: formDesc, documentType: formDocType, status: editing.status, lines: validLines }),
        })
      } else {
        await fetch("/api/accounting/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryDate: formDate, description: formDesc, documentType: formDocType, lines: validLines }),
        })
      }
      await reload()
      setShowForm(false)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounting/journal/${id}`, { method: "DELETE" })
    await reload()
  }

  const handlePost = async (id: string) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) return
    await fetch(`/api/accounting/journal/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, status: "posted" }),
    })
    await reload()
  }

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const updated = { ...l, [field]: value }
        if (field === "accountId") {
          const acc = (Array.isArray(accounts) ? accounts : []).find((a) => a.id === value)
          updated.accountNumber = acc?.accountNumber || ""
          updated.accountName = acc?.name || ""
        }
        return updated
      })
    )
  }

  const filtered = (Array.isArray(entries) ? entries : []).filter(
    (e) =>
      e.journalNumber?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDebit = lines.filter((l) => l.entryType === "debit").reduce((s, l) => s + l.amount, 0)
  const totalCredit = lines.filter((l) => l.entryType === "credit").reduce((s, l) => s + l.amount, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Сметкоплан и журнал</p>
        {tab === "journal" && (
          <button onClick={startNew} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">
            <Plus size={16} /> Нов запис
          </button>
        )}
      </div>
    }>
      <div className="mb-4 flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        <button onClick={() => setTab("plan")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "plan" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <BookOpen size={16} /> Сметкоплан
        </button>
        <button onClick={() => setTab("journal")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "journal" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <ListOrdered size={16} /> Журнал
        </button>
      </div>

      {tab === "plan" && (
        <AccountPlanTab accounts={accounts} onRefresh={loadAll} />
      )}

      {tab === "journal" && (
        <div>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по номер или описание..."
              className="w-full bg-transparent text-sm outline-none dark:text-white" />
            {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
          </div>

          {showForm && (
            <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required
                    className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
                  <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} required
                    className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип документ</label>
                  <select value={formDocType} onChange={(e) => setFormDocType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white">
                    <option value="manual">Ръчен запис</option>
                    <option value="sales_invoice">Продажба</option>
                    <option value="purchase_invoice">Покупка</option>
                    <option value="bank">Банка</option>
                    <option value="payroll">ТРЗ</option>
                  </select>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Счетоводни статии</h3>
                <button type="button" onClick={() => setLines([...lines, emptyLine()])} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800">
                  <Plus size={14} /> Добави ред
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                    <tr>
                      <th className="p-2 w-20">Тип</th>
                      <th className="p-2 w-28">Сметка</th>
                      <th className="p-2">Име на сметка</th>
                      <th className="p-2 w-28 text-right">Сума</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {lines.map((line, idx) => (
                      <tr key={line.id}>
                        <td className="p-2">
                          <select value={line.entryType} onChange={(e) => updateLine(line.id, "entryType", e.target.value)}
                            className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:text-white">
                            <option value="debit">Дебит</option>
                            <option value="credit">Кредит</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select value={line.accountId} onChange={(e) => updateLine(line.id, "accountId", e.target.value)}
                            className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:text-white">
                            <option value="">—</option>
                            {(Array.isArray(accounts) ? accounts : []).map((a) => (
                              <option key={a.id} value={a.id}>{a.accountNumber}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-xs text-slate-500">{line.accountName || "—"}</td>
                        <td className="p-2">
                          <input type="number" step="0.01" value={line.amount || ""} onChange={(e) => updateLine(line.id, "amount", Number(e.target.value))}
                            className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-right text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
                        </td>
                        <td className="p-2">
                          {lines.length > 2 && (
                            <button type="button" onClick={() => setLines(lines.filter((l) => l.id !== line.id))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span>Дебит: <strong>{totalDebit.toFixed(2)} €</strong></span>
                  <span>Кредит: <strong>{totalCredit.toFixed(2)} €</strong></span>
                  <span>Баланс: <strong className={isBalanced ? "text-teal-600" : "text-red-500"}>{isBalanced ? "✓" : `${(totalDebit - totalCredit).toFixed(2)} €`}</strong></span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
                  <button type="submit" disabled={!isBalanced || saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Създай"}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <FileText size={18} className="text-teal-600" /> Счетоводни записи ({filtered.length})
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <FileText size={40} className="mx-auto mb-3 text-slate-300" />
                <p>Няма записи.</p>
              </div>
            ) : (
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
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filtered.map((e) => {
                      const linesArr = Array.isArray(e.lines) ? e.lines : []
                      const debit = linesArr.filter((l) => l.entryType === "debit").reduce((s, l) => s + l.amount, 0)
                      const credit = linesArr.filter((l) => l.entryType === "credit").reduce((s, l) => s + l.amount, 0)
                      return (
                        <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-slate-600 whitespace-nowrap">{e.entryDate?.slice(0, 10)}</td>
                          <td className="p-3 font-mono text-xs text-slate-500">{e.journalNumber}</td>
                          <td className="p-3 text-slate-900 dark:text-white">{e.description}</td>
                          <td className="p-3 text-right">{debit > 0 ? `${debit.toFixed(2)} €` : "—"}</td>
                          <td className="p-3 text-right">{credit > 0 ? `${credit.toFixed(2)} €` : "—"}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.status === "posted" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                              {e.status === "posted" ? "Осчетоводено" : "Чернова"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              {e.status === "draft" && <button onClick={() => handlePost(e.id)} className="text-xs text-teal-600 hover:text-teal-800 font-bold">Осчетоводи</button>}
                              <button onClick={() => startEdit(e)} className="text-teal-600 hover:text-teal-800"><Edit size={15} /></button>
                              <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </SitePageShell>
  )
}
