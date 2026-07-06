"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Tractor, Plus, Save, Trash2, Edit, Search, X, Loader2, Wrench } from "lucide-react";

type Machine = {
  id: string; name: string; type: string; make: string; model: string;
  year: number | null; plateNumber: string; engineHours: number;
  fuelType: string; status: string; notes: string;
};

type Service = {
  id: string; machineId: string; date: string; type: string;
  description: string | null; cost: number; hoursAtService: number | null;
};

type ServiceForm = { date: string; type: string; description: string; cost: number; hoursAtService: string };

const MACHINE_TYPES = ["Трактор", "Комбайн", "Сеялка", "Пръскачка", "Плуг", "Ремарке", "Челна товарачка", "Друга"];
const SERVICE_TYPES = ["Годишен преглед", "Смяна на масло", "Филтри", "Ремонт", "Гуми", "Електроника", "Друго"];

export default function MashiniPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Machine>({ id: "", name: "", type: "Трактор", make: "", model: "", year: null, plateNumber: "", engineHours: 0, fuelType: "Дизел", status: "active", notes: "" });

  const [serviceMachine, setServiceMachine] = useState<Machine | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ date: new Date().toISOString().split("T")[0], type: "Годишен преглед", description: "", cost: 0, hoursAtService: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/farm/machines");
    const d = await res.json();
    setMachines(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/farm/machines/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/farm/machines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      await load();
      setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/machines/${id}`, { method: "DELETE" });
    await load();
  };

  const openServices = async (m: Machine) => {
    setServiceMachine(m);
    setLoadingServices(true);
    try {
      const res = await fetch(`/api/farm/machines/${m.id}/services`);
      setServices(await res.json());
    } finally { setLoadingServices(false); }
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceMachine) return;
    setSaving(true);
    try {
      await fetch(`/api/farm/machines/${serviceMachine.id}/services`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...serviceForm, hoursAtService: serviceForm.hoursAtService || null }),
      });
      const res = await fetch(`/api/farm/machines/${serviceMachine.id}/services`);
      setServices(await res.json());
      setServiceForm({ date: new Date().toISOString().split("T")[0], type: "Годишен преглед", description: "", cost: 0, hoursAtService: "" });
      await load();
    } finally { setSaving(false); }
  };

  const deleteService = async (id: string) => {
    if (!serviceMachine) return;
    await fetch(`/api/farm/machines/${serviceMachine.id}/services?id=${id}`, { method: "DELETE" });
    const res = await fetch(`/api/farm/machines/${serviceMachine.id}/services`);
    setServices(await res.json());
  };

  const filtered = machines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.make?.toLowerCase().includes(search.toLowerCase()) || m.plateNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = { total: machines.length, active: machines.filter((m) => m.status === "active").length, totalHours: machines.reduce((s, m) => s + m.engineHours, 0) };

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Машини и техника</p>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ id: "", name: "", type: "Трактор", make: "", model: "", year: null, plateNumber: "", engineHours: 0, fuelType: "Дизел", status: "active", notes: "" }); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нова машина
        </button>
      </div>
    }>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо машини</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Активни</p>
          <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Общо моточасове</p>
          <p className="text-xl font-bold">{stats.totalHours.toFixed(0)}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по име, марка или номер..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                {MACHINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Марка</label>
              <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="John Deere"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Модел</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Година</label>
              <input type="number" value={form.year || ""} onChange={(e) => setForm({ ...form, year: Number(e.target.value) || null })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Рег. номер</label>
              <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="СТ 1234 ВХ"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Моточасове</label>
              <input type="number" step="0.1" value={form.engineHours || ""} onChange={(e) => setForm({ ...form, engineHours: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Гориво</label>
              <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="Дизел">Дизел</option>
                <option value="Бензин">Бензин</option>
                <option value="Газ">Газ</option>
                <option value="Електричество">Електричество</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Статус</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="active">Активна</option>
                <option value="repair">В ремонт</option>
                <option value="retired">Изведена от употреба</option>
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

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium">
            <Tractor className="text-teal-600 dark:text-teal-400" /> Машини и техника
          </h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <Tractor size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма машини.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Име</th><th className="p-3">Тип</th><th className="p-3">Марка/Модел</th><th className="p-3 text-right">Моточасове</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.type}</td>
                    <td className="p-3 text-slate-600">{m.make} {m.model}</td>
                    <td className="p-3 text-right font-mono text-sm">{m.engineHours.toFixed(0)}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : m.status === "repair" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800"}`}>
                        {m.status === "active" ? "Активна" : m.status === "repair" ? "Ремонт" : "Изведена"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => openServices(m)} className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30" title="Сервизна книга"><Wrench size={16} /></button>
                        <button onClick={() => { setForm(m); setEditing(m); setShowForm(true); }} className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(m.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {serviceMachine && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Wrench className="text-sky-600" size={20} /> Сервизна книга — {serviceMachine.name}</h2>
              <button onClick={() => setServiceMachine(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
            </div>

            <form onSubmit={addService} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Дата</label>
                <input type="date" value={serviceForm.date} onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })} required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Тип</label>
                <select value={serviceForm.type} onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
                  {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-600">Описание</label>
                <input value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="Смяна на масло и филтри"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Разход (лв)</label>
                <input type="number" step="0.01" value={serviceForm.cost || ""} onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Моточасове при сервиз</label>
                <input type="number" step="0.1" value={serviceForm.hoursAtService} onChange={(e) => setServiceForm({ ...serviceForm, hoursAtService: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
              </div>
              <div className="flex items-end sm:col-span-2">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Добави сервиз
                </button>
              </div>
            </form>

            {loadingServices ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
            ) : services.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Няма сервизни записи.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {services.map((s) => (
                  <div key={s.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{s.type}</span>
                        <span className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString("bg-BG")}</span>
                      </div>
                      {s.description && <p className="mt-1 text-sm">{s.description}</p>}
                      <div className="mt-1 flex gap-4 text-xs text-slate-500">
                        {s.cost > 0 && <span>💰 {s.cost.toFixed(2)} лв</span>}
                        {s.hoursAtService !== null && <span>⏱ {s.hoursAtService.toFixed(0)} моточаса</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteService(s.id)} className="shrink-0 rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
