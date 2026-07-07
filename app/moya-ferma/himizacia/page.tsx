"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { FlaskConical, Plus, Save, Trash2, Loader2, FileText } from "lucide-react";

type Field = { id: string; name: string };
type Product = { id: string; name: string; productType: string; activeSubstance: string | null };
type Application = { id: string; application_date: string; field_name: string; product_name: string; dose_amount: number; dose_unit: string; total_amount: number; crop: string; pest_target: string; operator_name: string; notes: string };

export default function HimizaciaPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  const [form, setForm] = useState({ fieldId: "", productId: "", applicationDate: new Date().toISOString().split("T")[0], doseAmount: 0, doseUnit: "l/da", totalAmount: 0, totalUnit: "l", crop: "", pestTarget: "", applicationMethod: "", operatorName: "", notes: "" });
  const [productForm, setProductForm] = useState({ name: "", productType: "herbicide", activeSubstance: "", concentration: "", unitOfMeasure: "l", manufacturer: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [chemRes, fieldRes] = await Promise.all([
        fetch("/api/farm/chemicals"),
        fetch("/api/fields"),
      ]);
      const chem = await chemRes.json();
      const flds = await fieldRes.json();
      setApps((chem.applications || []).map((a: any) => ({
        id: a.id, application_date: a.application_date, field_name: a.field_name, product_name: a.product_name,
        dose_amount: a.doseAmount, dose_unit: a.dose_unit, total_amount: a.totalAmount,
        crop: a.crop, pest_target: a.pest_target, operator_name: a.operator_name, notes: a.notes,
      })));
      setProducts(chem.products || []);
      setFields(Array.isArray(flds) ? flds : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/chemicals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _type: "application", ...form }),
      });
      await load();
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farm/chemicals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _type: "product", ...productForm }),
      });
      await load();
      setShowProductForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/chemicals?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Дневник на химизацията (БАБХ)</p>
        <div className="flex gap-2">
          <button onClick={() => setShowProductForm(!showProductForm)}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300">
            <Plus size={16} /> Продукт
          </button>
          <button onClick={() => { setShowForm(!showForm); }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <Plus size={16} /> Нов запис
          </button>
        </div>
      </div>
    }>
      {showProductForm && (
        <form onSubmit={handleSaveProduct} className="mb-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-bold">Нов продукт</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име</label>
              <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип</label>
              <select value={productForm.productType} onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="herbicide">Хербицид</option><option value="fungicide">Фунгицид</option><option value="insecticide">Инсектицид</option><option value="acaricide">Акарицид</option><option value="growth_regulator">Регулатор</option><option value="fertilizer">Тор</option><option value="other">Друг</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Активно вещество</label>
              <input value={productForm.activeSubstance} onChange={(e) => setProductForm({ ...productForm, activeSubstance: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Концентрация</label>
              <input value={productForm.concentration} onChange={(e) => setProductForm({ ...productForm, concentration: e.target.value })} placeholder="480 g/l"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Мярка</label>
              <select value={productForm.unitOfMeasure} onChange={(e) => setProductForm({ ...productForm, unitOfMeasure: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="l">l</option><option value="kg">kg</option><option value="g">g</option><option value="ml">ml</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Производител</label>
              <input value={productForm.manufacturer} onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Добави
            </button>
            <button type="button" onClick={() => setShowProductForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSaveApp} className="mb-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-bold">Нов запис за приложение</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата</label>
              <input type="date" value={form.applicationDate} onChange={(e) => setForm({ ...form, applicationDate: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Парцел</label>
              <select value={form.fieldId} onChange={(e) => setForm({ ...form, fieldId: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">Избери парцел</option>
                {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
              <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Продукт</label>
              <div className="flex gap-2">
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required
                  className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                  <option value="">Избери продукт</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {products.length === 0 ? (
                  <button type="button" onClick={() => { setShowForm(false); setShowProductForm(true); }}
                    className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    + Продукт
                  </button>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Култура</label>
              <input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="Пшеница"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Доза</label>
                <input type="number" step="0.01" value={form.doseAmount || ""} onChange={(e) => setForm({ ...form, doseAmount: Number(e.target.value) })} required
                  className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Мярка</label>
                <select value={form.doseUnit} onChange={(e) => setForm({ ...form, doseUnit: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                  <option value="l/da">l/da</option><option value="kg/da">kg/da</option><option value="ml/da">ml/da</option><option value="g/da">g/da</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Общо количество</label>
              <input type="number" step="0.01" value={form.totalAmount || ""} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Обект / Вредител</label>
              <input value={form.pestTarget} onChange={(e) => setForm({ ...form, pestTarget: e.target.value })} placeholder="Плевели"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Метод</label>
              <select value={form.applicationMethod} onChange={(e) => setForm({ ...form, applicationMethod: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">—</option><option value="пръскане">Пръскане</option><option value="опрашване">Опрашване</option><option value="инжектиране">Инжектиране</option><option value="поливане">Поливане</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Оператор</label>
              <input value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бележки</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Добави запис
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
          </div>
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium"><FlaskConical className="text-teal-600 dark:text-teal-400" /> Дневник на химизацията</h1>
          <p className="mt-1 text-sm text-slate-500">Протокол за приложени продукти за РЗ (БАБХ)</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500"><FlaskConical size={40} className="mx-auto mb-3 text-slate-300" /><p>Все още няма записи.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr><th className="p-3">Дата</th><th className="p-3">Парцел</th><th className="p-3">Продукт</th><th className="p-3">Култура</th><th className="p-3">Доза</th><th className="p-3">Вредител</th><th className="p-3">Оператор</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(a.application_date).toLocaleDateString("bg-BG")}</td>
                    <td className="p-3 font-medium">{a.field_name || "—"}</td>
                    <td className="p-3 text-slate-600">{a.product_name || "—"}</td>
                    <td className="p-3 text-slate-600">{a.crop || "—"}</td>
                    <td className="p-3 text-slate-600">{a.dose_amount} {a.dose_unit}</td>
                    <td className="p-3 text-slate-600">{a.pest_target || "—"}</td>
                    <td className="p-3 text-slate-600">{a.operator_name || "—"}</td>
                    <td className="p-3"><button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => window.open('/api/farm/chemicals/export', '_blank')} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
          <FileText size={16} /> Експорт за БАБХ (PDF)
        </button>
      </div>
    </SitePageShell>
  );
}
