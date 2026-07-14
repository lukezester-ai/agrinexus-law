"use client"

import { useEffect, useState } from "react"
import { SitePageShell } from "@/components/site-page-shell"
import { Plus, Search, X, Save, Trash2, Edit, Loader2, Building2, Users } from "lucide-react"
import LinkedDocuments from "@/components/linked-documents"

type Counterparty = {
  id: string
  type: "client" | "supplier" | "both"
  name: string
  eik: string | null
  vatNumber: string | null
  address: string | null
  city: string | null
  email: string | null
  phone: string | null
  contactPerson: string | null
  isActive: boolean
}

const emptyForm: {
  type: "client" | "supplier" | "both"
  name: string
  eik: string
  vatNumber: string
  address: string
  city: string
  email: string
  phone: string
  contactPerson: string
  isActive: boolean
} = {
  type: "client",
  name: "",
  eik: "",
  vatNumber: "",
  address: "",
  city: "",
  email: "",
  phone: "",
  contactPerson: "",
  isActive: true,
}

export default function KlientiPage() {
  const [items, setItems] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Counterparty | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterType, setFilterType] = useState<string>("all")

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/accounting/counterparties").then((r) => r.json()).catch(() => [])
      setItems(Array.isArray(res) ? res : [])
    } catch (e) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const startEdit = (item: Counterparty) => {
    setEditing(item)
    setForm({
      type: item.type,
      name: item.name,
      eik: item.eik ?? "",
      vatNumber: item.vatNumber ?? "",
      address: item.address ?? "",
      city: item.city ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      contactPerson: item.contactPerson ?? "",
      isActive: item.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/accounting/counterparties/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/accounting/counterparties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      await load()
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте?")) return
    await fetch(`/api/accounting/counterparties/${id}`, { method: "DELETE" })
    await load()
  }

  const filtered = (Array.isArray(items) ? items : []).filter((c) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || c.name?.toLowerCase().includes(q) || (c.eik ?? "").includes(q) || (c.vatNumber ?? "").includes(q) || (c.city ?? "").toLowerCase().includes(q)
    const matchesType = filterType === "all" || c.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Users size={16} className="inline mr-1" /> Клиенти и доставчици
        </p>
        <button onClick={startNew} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">
          <Plus size={16} /> Нов контрагент
        </button>
      </div>
    }>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по име, ЕИК, ДДС номер или град..."
            className="w-full bg-transparent text-sm outline-none dark:text-white" />
          {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="all">Всички</option>
          <option value="client">Клиенти</option>
          <option value="supplier">Доставчици</option>
          <option value="both">И двете</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
            {editing ? "Редактиране" : "Нов"} контрагент
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "client" | "supplier" | "both" })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white">
                <option value="client">Клиент</option>
                <option value="supplier">Доставчик</option>
                <option value="both">Клиент и доставчик</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ЕИК</label>
              <input value={form.eik} onChange={(e) => setForm({ ...form, eik: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ДДС номер</label>
              <input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Град</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Адрес</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Имейл</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Телефон</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Контактно лице</label>
              <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4" />
            <label htmlFor="isActive" className="text-sm text-slate-600 dark:text-slate-400">Активен</label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Създай"}
            </button>
          </div>
          {editing && <div className="mt-4"><LinkedDocuments module="counterparties" entityId={editing.id} /></div>}
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-5 dark:bg-teal-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Building2 size={18} className="text-teal-600" /> Контрагенти ({filtered.length})
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <Building2 size={40} className="mx-auto mb-3 text-slate-300" />
            <p>Няма контрагенти. Добавете първия клиент или доставчик.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="p-3">Име</th>
                  <th className="p-3">Тип</th>
                  <th className="p-3">ЕИК</th>
                  <th className="p-3">ДДС</th>
                  <th className="p-3">Град</th>
                  <th className="p-3">Имейл</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.type === "supplier" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                        : c.type === "both" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                      }`}>
                        {c.type === "client" ? "Клиент" : c.type === "supplier" ? "Доставчик" : "Двете"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{c.eik || "—"}</td>
                    <td className="p-3 font-mono text-xs text-slate-500">{c.vatNumber || "—"}</td>
                    <td className="p-3 text-slate-600">{c.city || "—"}</td>
                    <td className="p-3 text-slate-600">{c.email || "—"}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {c.isActive ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(c)} className="text-teal-600 hover:text-teal-800"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
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
  )
}
