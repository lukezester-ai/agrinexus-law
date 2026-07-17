"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  FlaskConical, 
  Plus, 
  Save, 
  Trash2, 
  Loader2, 
  FileText,
  ShieldAlert,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Field = { id: string; name: string; sizeDa: number };
type Product = { id: string; name: string; productType: string; activeSubstance: string | null; nPercent?: number };
type Application = { 
  id: string; 
  application_date: string; 
  field_name: string; 
  product_name: string; 
  dose_amount: number; 
  dose_unit: string; 
  total_amount: number; 
  crop: string; 
  pest_target: string; 
  operator_name: string; 
  notes: string;
  nAppliedKgDa?: number;
};

const DEMO_FIELDS: Field[] = [
  { id: "f-1", name: "Нива Слатина - Равнището", sizeDa: 420 },
  { id: "f-2", name: "Масив Бреста - Горна нива", sizeDa: 310 },
  { id: "f-3", name: "Лозя и Трайни насаждения", sizeDa: 150 },
];

const DEMO_PRODUCTS: Product[] = [
  { id: "p-1", name: "Амониев нитрат (34.4% N)", productType: "fertilizer", activeSubstance: "Ammonium Nitrate", nPercent: 34.4 },
  { id: "p-2", name: "Карбамид / Урея (46.0% N)", productType: "fertilizer", activeSubstance: "Urea", nPercent: 46.0 },
  { id: "p-3", name: "Течен тор УАН 32 (32.0% N)", productType: "fertilizer", activeSubstance: "UAN", nPercent: 32.0 },
  { id: "p-4", name: "Хербицид Пума Супер 7.5 ЕВ", productType: "herbicide", activeSubstance: "Fenoxaprop-P-ethyl" },
  { id: "p-5", name: "Фунгицид Амистар Екстра", productType: "fungicide", activeSubstance: "Azoxystrobin" },
];

const DEMO_APPS: Application[] = [
  {
    id: "app-1",
    application_date: "2025-03-12",
    field_name: "Нива Слатина - Равнището",
    product_name: "Амониев нитрат (34.4% N)",
    dose_amount: 32.0,
    dose_unit: "kg/da",
    total_amount: 13440,
    crop: "Пшеница",
    pest_target: "Първо пролетно подхранване",
    operator_name: "Иван Петров (Трактор John Deere)",
    notes: "Нитратна уязвима зона - спазен лимит",
    nAppliedKgDa: 11.01 // 32kg * 34.4%
  },
  {
    id: "app-2",
    application_date: "2025-04-05",
    field_name: "Нива Слатина - Равнището",
    product_name: "Хербицид Пума Супер 7.5 ЕВ",
    dose_amount: 0.10,
    dose_unit: "l/da",
    total_amount: 42,
    crop: "Пшеница",
    pest_target: "Зитни плевели (Див овес)",
    operator_name: "Георги Димитров",
    notes: "Пръскане с пръскачка Berthoud",
    nAppliedKgDa: 0
  },
  {
    id: "app-3",
    application_date: "2025-04-18",
    field_name: "Масив Бреста - Горна нива",
    product_name: "Карбамид / Урея (46.0% N)",
    dose_amount: 35.0,
    dose_unit: "kg/da",
    total_amount: 10850,
    crop: "Царевица",
    pest_target: "Предсеитбено торене",
    operator_name: "Иван Петров",
    notes: "Внимание: Висока азотна доза",
    nAppliedKgDa: 16.10 // 35kg * 46%
  }
];

export default function HimizaciaPage() {
  const [activeTab, setActiveTab] = useState<"journal" | "nitrate_ctrl" | "ai_recommend">("journal");
  const [apps, setApps] = useState<Application[]>(DEMO_APPS);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [fields, setFields] = useState<Field[]>(DEMO_FIELDS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [inventoryWarning, setInventoryWarning] = useState<string | null>(null);

  const [aiCrop, setAiCrop] = useState("Пшеница");
  const [aiPest, setAiPest] = useState("Житна пиявица");
  const [aiFieldId, setAiFieldId] = useState(DEMO_FIELDS[0].id);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any | null>(null);

  const [form, setForm] = useState({ 
    fieldId: DEMO_FIELDS[0].id, 
    productId: DEMO_PRODUCTS[0].id, 
    applicationDate: new Date().toISOString().split("T")[0], 
    doseAmount: 0, 
    doseUnit: "kg/da", 
    totalAmount: 0, 
    crop: "Пшеница", 
    pestTarget: "", 
    applicationMethod: "пръскане", 
    operatorName: "Иван Петров", 
    notes: "" 
  });

  const [productForm, setProductForm] = useState({ 
    name: "", 
    productType: "fertilizer", 
    activeSubstance: "", 
    concentration: "", 
    unitOfMeasure: "kg", 
    manufacturer: "" 
  });

  // Nitrate check simulator state
  const [simField, setSimField] = useState("f-1");
  const [simFertilizer, setSimFertilizer] = useState("p-1");
  const [simDose, setSimDose] = useState(18.0);

  const handleRequestAiRecommend = async () => {
    setAiLoading(true);
    setAiResults(null);
    try {
      const field = fields.find(f => f.id === aiFieldId) || fields[0] || DEMO_FIELDS[0];
      const res = await fetch("/api/farm/chemicals/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: aiCrop,
          pestOrDisease: aiPest,
          areaDecares: field?.sizeDa || 100,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResults(data);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAiRecommendation = async (rec: any) => {
    setSaving(true);
    try {
      const field = fields.find(f => f.id === aiFieldId) || fields[0] || DEMO_FIELDS[0];
      let prod = products.find(p => p.name.toLowerCase() === rec.productName.toLowerCase() || (rec.productId && p.id === rec.productId));
      if (!prod) {
        prod = {
          id: rec.productId || `p-${Date.now()}`,
          name: rec.productName,
          productType: rec.productType || "insecticide",
          activeSubstance: rec.activeSubstance || null
        };
      }

      const res = await fetch("/api/farm/chemicals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "application",
          fieldId: field.id,
          productId: prod.id,
          applicationDate: new Date().toISOString().split("T")[0],
          doseAmount: rec.dosePerDa,
          doseUnit: rec.doseUnit,
          totalAmount: rec.totalNeeded,
          totalUnit: rec.unitOfMeasure || "л",
          crop: aiCrop,
          pestTarget: aiPest,
          applicationMethod: "AI препоръка - пръскане",
          operatorName: "Иван Петров (AI Агроном)",
          notes: `[AI Препоръка Борис]: ${rec.agronomistRationale}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hasInventoryWarning && data.warningMessage) {
          setInventoryWarning(data.warningMessage);
        } else {
          setInventoryWarning("✅ Успешно запазено в Дневника по РЗ и торене + автоматично изписване на необходимото количество от модул Склад!");
        }
      }

      await load();
      setActiveTab("journal");
    } finally {
      setSaving(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [chemRes, fieldRes] = await Promise.all([
        fetch("/api/farm/chemicals"),
        fetch("/api/fields"),
      ]);
      if (chemRes.ok) {
        const chem = await chemRes.json();
        if (chem.applications && chem.applications.length > 0) {
          setApps(chem.applications.map((a: any) => ({
            id: a.id, application_date: a.application_date, field_name: a.field_name, product_name: a.product_name,
            dose_amount: a.doseAmount, dose_unit: a.dose_unit, total_amount: a.totalAmount,
            crop: a.crop, pest_target: a.pest_target, operator_name: a.operator_name, notes: a.notes,
            nAppliedKgDa: a.product_name?.toLowerCase().includes("нитрат") ? a.doseAmount * 0.344 : a.product_name?.toLowerCase().includes("карбамид") ? a.doseAmount * 0.46 : 0
          })));
        }
        if (chem.products && chem.products.length > 0) setProducts(chem.products);
      }
      if (fieldRes.ok) {
        const flds = await fieldRes.json();
        if (Array.isArray(flds) && flds.length > 0) {
          setFields(flds.map((f: any) => ({ id: f.id, name: f.name, sizeDa: f.area_da || 300 })));
        }
      }
    } catch {
      // Keep demo data
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const field = fields.find(f => f.id === form.fieldId) || fields[0];
      const prod = products.find(p => p.id === form.productId) || products[0];
      let nApplied = 0;
      if (prod.productType === "fertilizer") {
        const nPerc = prod.nPercent || (prod.name.includes("34") ? 34.4 : prod.name.includes("46") ? 46 : 20);
        nApplied = (Number(form.doseAmount) * nPerc) / 100;
      }

      const res = await fetch("/api/farm/chemicals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _type: "application", ...form, fieldName: field.name, productName: prod.name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.hasInventoryWarning && data.warningMessage) {
          setInventoryWarning(data.warningMessage);
        } else {
          setInventoryWarning(null);
        }
      }

      setApps(prev => [{
        id: `app-${Date.now()}`,
        application_date: form.applicationDate,
        field_name: field.name,
        product_name: prod.name,
        dose_amount: Number(form.doseAmount),
        dose_unit: form.doseUnit,
        total_amount: Number(form.totalAmount) || Number(form.doseAmount) * field.sizeDa,
        crop: form.crop,
        pest_target: form.pestTarget,
        operator_name: form.operatorName,
        notes: form.notes,
        nAppliedKgDa: nApplied
      }, ...prev]);

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
      setProducts(prev => [...prev, { id: `p-${Date.now()}`, name: productForm.name, productType: productForm.productType, activeSubstance: productForm.activeSubstance }]);
      setShowProductForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/farm/chemicals?id=${id}`, { method: "DELETE" });
    setApps(apps.filter((a) => a.id !== id));
  };

  // Nitrate math per field
  const getFieldTotalN = (fieldName: string) => {
    return apps.filter(a => a.field_name === fieldName).reduce((sum, a) => sum + (a.nAppliedKgDa || 0), 0);
  };

  // Current simulation math
  const selectedSimFieldObj = fields.find(f => f.id === simField) || fields[0];
  const selectedSimProdObj = products.find(p => p.id === simFertilizer) || products[0];
  const currentFieldN = getFieldTotalN(selectedSimFieldObj.name);
  const simNPercent = selectedSimProdObj.nPercent || 34.4;
  const addedN = (simDose * simNPercent) / 100;
  const projectedTotalN = currentFieldN + addedN;
  const isOverLimit = projectedTotalN > 17.0;

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Дневник по Растителна защита и Торене</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              БАБХ Протоколи • Нитратна Директива
            </span>
          </div>

          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setActiveTab("journal")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition",
                activeTab === "journal"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Дневник за РЗ и торене (БАБХ)
            </button>
            <button
              onClick={() => setActiveTab("nitrate_ctrl")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "nitrate_ctrl"
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <ShieldAlert size={13} className={activeTab === "nitrate_ctrl" ? "text-white" : "text-rose-500"} />
              <span>Азотен Контролер (17 кг/дка НУЗ)</span>
            </button>
            <button
              onClick={() => setActiveTab("ai_recommend")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "ai_recommend"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Sparkles size={13} className={activeTab === "ai_recommend" ? "text-white" : "text-purple-500"} />
              <span>🤖 AI Агроном (Препоръка + Склад)</span>
            </button>
            <Link
              href="/moya-ferma/himizacia/puhv"
              className="rounded-xl px-4 py-1.5 text-xs font-black transition flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-500/30"
            >
              <Sprout size={13} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
              <span>🌱 План Еко-ЗВПП (ПУХВ • СЕУ)</span>
            </Link>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {inventoryWarning && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold">Предупреждение от Склада (Наличност под нулата)</p>
                <p className="text-sm">{inventoryWarning}</p>
              </div>
            </div>
            <button onClick={() => setInventoryWarning(null)} className="rounded-lg p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {activeTab === "journal" ? (
          <>
            {/* Banner Hero */}
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <FlaskConical size={14} />
                  <span>Валидност при проверка от БАБХ и ДФЗ</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Електронен дневник на растителната защита и минералното торене
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Записвайте всяко пръскане и торене по масиви. Автоматизиран изчислен разход на продукти, обвързан със складовите наличности и готов за директен експорт в нормативен протокол по образец на БАБХ.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowProductForm(!showProductForm)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} className="text-emerald-600" /> 
                  <span>Нов препарат / Тор</span>
                </button>
                <button 
                  onClick={() => setShowForm(!showForm)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                >
                  <Plus size={16} /> 
                  <span>{showForm ? "Скрий формата" : "Запиши ново мероприятие (Пръскане / Торене)"}</span>
                </button>
              </div>

              <button 
                onClick={() => window.open('/api/farm/chemicals/export', '_blank')} 
                className="rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 px-6 py-3 text-xs font-black text-white transition flex items-center gap-2 shadow-sm"
              >
                <FileText size={16} /> 
                <span>Експортирай официален Дневник за БАБХ (PDF/XML)</span>
              </button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <form onSubmit={handleSaveProduct} className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical size={18} className="text-emerald-600" />
                    <span>Добавяне на нов препарат за растителна защита или тор в номенклатурата</span>
                  </h3>
                  <button type="button" onClick={() => setShowProductForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Търговско наименование</label>
                    <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required placeholder="напр. Амониев нитрат или Пума Супер" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип на продукта</label>
                    <select value={productForm.productType} onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="fertilizer">Минерален / течен тор (N-P-K)</option>
                      <option value="herbicide">Хербицид (срещу плевели)</option>
                      <option value="fungicide">Фунгицид (срещу гъбични болести)</option>
                      <option value="insecticide">Инсектицид (срещу неприятели)</option>
                      <option value="growth_regulator">Регулатор на растежа</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Активно вещество / % Азот (N)</label>
                    <input value={productForm.activeSubstance} onChange={(e) => setProductForm({ ...productForm, activeSubstance: e.target.value })} placeholder="34.4% N или Azoxystrobin" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowProductForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-black text-white transition">Запази в номенклатурата</button>
                </div>
              </form>
            )}

            {/* Application Form */}
            {showForm && (
              <form onSubmit={handleSaveApp} className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus size={18} className="text-emerald-600" />
                    <span>Запис на проведено агро-техническо мероприятие по полета</span>
                  </h3>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Дата на мероприятието</label>
                    <input type="date" value={form.applicationDate} onChange={(e) => setForm({ ...form, applicationDate: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Земеделски парцел / Нива</label>
                    <select value={form.fieldId} onChange={(e) => setForm({ ...form, fieldId: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      {fields.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.sizeDa} дка)</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Продукт / Тор</label>
                    <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Зърнена култура</label>
                    <input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="Пшеница / Царевица" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Норма на приложение (кг/дка или л/дка)</label>
                    <div className="flex gap-2">
                      <input type="number" step="0.01" value={form.doseAmount || ""} onChange={(e) => setForm({ ...form, doseAmount: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                      <select value={form.doseUnit} onChange={(e) => setForm({ ...form, doseUnit: e.target.value })} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <option value="kg/da">kg/da</option>
                        <option value="l/da">l/da</option>
                        <option value="ml/da">ml/da</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Вредител / Цел на торене</label>
                    <input value={form.pestTarget} onChange={(e) => setForm({ ...form, pestTarget: e.target.value })} placeholder="Първо пролетно подхранване / Див овес" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Оператор и механизация (Трактор & Инвентар)</label>
                    <input value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })} placeholder="Иван Петров (Трактор John Deere 8R + Berthoud)" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Метод</label>
                    <select value={form.applicationMethod} onChange={(e) => setForm({ ...form, applicationMethod: e.target.value })} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="пръскане">Листно пръскане</option>
                      <option value="разхвърляне">Разхвърляне на гранули (торене)</option>
                      <option value="инжектиране">Инжектиране / Течно торене</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Отказ</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition">
                    Запиши в дневника
                  </button>
                </div>
              </form>
            )}

            {/* Main Applications Table */}
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="border-b border-slate-200/80 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical size={20} className="text-emerald-600" />
                    <span>Протоколи за проведени растителнозащитни и торови мероприятия</span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Официален регистър съгласно Наредбата за изискванията към употребата на продукти за растителна защита</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Дата</th>
                      <th className="p-4">Земеделски парцел</th>
                      <th className="p-4">Продукт / Препарат</th>
                      <th className="p-4">Култура</th>
                      <th className="p-4 text-right">Доза на дка</th>
                      <th className="p-4 text-right">Внесен чист азот (N)</th>
                      <th className="p-4">Цел / Вредител</th>
                      <th className="p-4">Оператор & Техника</th>
                      <th className="p-4 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {apps.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-slate-500">{new Date(a.application_date).toLocaleDateString("bg-BG")}</td>
                        <td className="p-4 font-black text-slate-900 dark:text-white">{a.field_name}</td>
                        <td className="p-4 font-extrabold text-emerald-700 dark:text-emerald-300">{a.product_name}</td>
                        <td className="p-4 text-xs font-bold">{a.crop}</td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white">{a.dose_amount} {a.dose_unit}</td>
                        <td className="p-4 text-right font-bold">
                          {a.nAppliedKgDa && a.nAppliedKgDa > 0 ? (
                            <span className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-black text-amber-800 dark:text-amber-300">
                              +{a.nAppliedKgDa.toFixed(2)} кг N/дка
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">— (РЗ)</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{a.pest_target || "—"}</td>
                        <td className="p-4 text-xs text-slate-500">{a.operator_name}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDelete(a.id)} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === "nitrate_ctrl" ? (
          /* TAB 2: Nitrate Directive Controller 17 kg/da */
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
                  <ShieldAlert size={14} />
                  <span>Нитратна Директива (91/676/ЕИО) • Лимит 17 кг чист азот/дка</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Азотен контролер и защита от санкции в Нитратно уязвими зони (НУЗ)
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Съгласно Наредба № 2 за защита на водите от замърсяване с нитрати от земеделски източници, общото годишно количество чист азот (N), внесено на 1 декар земеделска площ в НУЗ, не трябва да надвишава <strong>17.0 кг/дка</strong>. Превишаването води до директно урязване или спиране на субсидиите от ДФЗ.
                </p>
              </div>
            </div>

            {/* Field Status Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {fields.map((f) => {
                const totalN = getFieldTotalN(f.name);
                const percentUsed = Math.min(100, (totalN / 17.0) * 100);
                const over = totalN > 17.0;

                return (
                  <div 
                    key={f.id} 
                    className={cn(
                      "glass-panel-pro rounded-3xl p-6 border transition-all duration-300 shadow-sm",
                      over 
                        ? "border-rose-500/80 bg-rose-500/10 dark:bg-rose-950/40" 
                        : percentUsed > 80 
                        ? "border-amber-500/60 bg-amber-500/10 dark:bg-amber-950/30" 
                        : "border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{f.sizeDa} дка</span>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase",
                        over ? "bg-rose-500 text-white" : percentUsed > 80 ? "bg-amber-500 text-white" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      )}>
                        {over ? "⚠️ ПРЕВИШЕН ЛИМИТ" : percentUsed > 80 ? "▲ Близо до лимит" : "✅ В норма"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{f.name}</h3>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500">Внесен чист азот (N):</span>
                        <p className={cn("text-3xl font-black", over ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
                          {totalN.toFixed(2)} <span className="text-sm font-bold">кг N/дка</span>
                        </p>
                      </div>
                      <div className="text-right text-xs font-bold text-slate-400">
                        Лимит: 17.0 кг
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", over ? "bg-rose-600" : percentUsed > 80 ? "bg-amber-500" : "bg-emerald-500")} 
                        style={{ width: `${percentUsed}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive NPK Simulation & Alarm Tool */}
            <div className="glass-panel-pro rounded-[32px] border border-amber-500/40 bg-gradient-to-b from-white via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Симулатор за планиране на предсеитбено и пролетно торене</h3>
                  <p className="text-xs font-semibold text-slate-500">Проверете дали планираната доза тор ще наруши лимита от 17 кг чист азот преди да пуснете тракторите на полето</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Изберете земеделски парцел</label>
                  <select 
                    value={simField} 
                    onChange={(e) => setSimField(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name} (Текущ N: {getFieldTotalN(f.name).toFixed(2)} кг/дка)</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип азотен тор</label>
                  <select 
                    value={simFertilizer} 
                    onChange={(e) => setSimFertilizer(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {products.filter(p => p.productType === "fertilizer").map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.nPercent || 34.4}% чист азот)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Планирана доза тор (кг/дка или л/дка)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={simDose} 
                    onChange={(e) => setSimDose(Number(e.target.value))} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
              </div>

              {/* Simulation Result Alert Box */}
              <div className={cn(
                "rounded-[24px] p-6 border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6",
                isOverLimit
                  ? "border-rose-500 bg-rose-500/15 dark:bg-rose-950/50 shadow-lg shadow-rose-500/10"
                  : "border-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/10"
              )}>
                <div className="flex items-start gap-4">
                  {isOverLimit ? (
                    <div className="rounded-2xl bg-rose-600 p-3.5 text-white shrink-0 shadow-md">
                      <AlertTriangle size={28} />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-emerald-600 p-3.5 text-white shrink-0 shadow-md">
                      <CheckCircle2 size={28} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <h4 className={cn("text-base font-black", isOverLimit ? "text-rose-900 dark:text-rose-200" : "text-emerald-900 dark:text-emerald-200")}>
                      {isOverLimit ? "⚠️ РИСК ОТ САНКЦИЯ: Планираното торене превишава законовия лимит в НУЗ!" : "✅ В НОРМА: Допустимо предсеитбено/пролетно подхранване"}
                    </h4>
                    <p className={cn("text-xs font-medium leading-relaxed max-w-xl", isOverLimit ? "text-rose-800 dark:text-rose-300" : "text-emerald-800 dark:text-emerald-300")}>
                      {isOverLimit
                        ? `Добавянето на ${simDose} кг/дка от този тор внася още +${addedN.toFixed(2)} кг чист азот. Общото годишно количество ще достигне ${projectedTotalN.toFixed(2)} кг N/дка, което нарушава лимита от 17.0 кг по Нитратната директива!`
                        : `Добавянето на +${addedN.toFixed(2)} кг чист азот ще повиши общото ниво на парцела до ${projectedTotalN.toFixed(2)} кг N/дка. Имате още +${(17.0 - projectedTotalN).toFixed(2)} кг/дка аванс до нормативния таван.`}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0 bg-white/80 dark:bg-slate-900/80 px-6 py-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Прогнозен годишен N</span>
                  <span className={cn("text-2xl font-black", isOverLimit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                    {projectedTotalN.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 block">кг чист N / дка</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "ai_recommend" ? (
          /* TAB 3: AI Agronomist Recommendation & Auto-reserve */
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/20 border border-purple-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 mb-3">
                  <Sparkles size={14} />
                  <span>AI Агроном Борис • Експертна Диагностика и Авто-Резервация</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Интелигентен избор на препарати (РЗ) със складова синхронизация
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Посочете културата, вредителя или болестта и изберете земеделски парцел. AI Агроном Борис ще препоръча точния препарат, ще изчисли дозата и ще провери наличностите в Склада за директно изписване.
                </p>
              </div>
            </div>

            <div className="glass-panel-pro rounded-[32px] border border-purple-500/30 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Земеделска култура</label>
                  <select
                    value={aiCrop}
                    onChange={(e) => setAiCrop(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Пшеница">Пшеница</option>
                    <option value="Царевица">Царевица</option>
                    <option value="Слънчоглед">Слънчоглед</option>
                    <option value="Ечемик">Ечемик</option>
                    <option value="Рапица">Рапица</option>
                    <option value="Лозя">Лозя (Трайни насаждения)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Проблем / Вредител / Болест / Плевели</label>
                  <input
                    value={aiPest}
                    onChange={(e) => setAiPest(e.target.value)}
                    placeholder="напр. Житна пиявица, Септориоза, Див овес..."
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Земеделски парцел (Площ)</label>
                  <select
                    value={aiFieldId}
                    onChange={(e) => setAiFieldId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.sizeDa} дка)</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRequestAiRecommend}
                  disabled={aiLoading || !aiPest}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>{aiLoading ? "Анализ на патогени и наличности..." : "✨ Поискай AI препоръка от Борис (Агроном)"}</span>
                </button>
              </div>
            </div>

            {aiResults && (
              <div className="space-y-6 animate-fadeIn">
                <div className="rounded-3xl border border-purple-200 bg-purple-50/70 p-6 dark:border-purple-900 dark:bg-purple-950/40">
                  <div className="flex items-center gap-3 mb-2 text-purple-900 dark:text-purple-200 font-black text-base">
                    <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
                    <span>Експертно становище на AI Агроном Борис</span>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                    {aiResults.aiAdviceSummary}
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {aiResults.recommendations?.map((rec: any, idx: number) => (
                    <div key={idx} className="glass-panel-pro rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                              {rec.productType === 'insecticide' ? '🐛 Инсектицид' : rec.productType === 'fungicide' ? '🍄 Фунгицид' : rec.productType === 'herbicide' ? '🌿 Хербицид' : '🧪 Тор / Стимулатор'}
                            </span>
                            <h4 className="mt-2 text-lg font-black text-slate-900 dark:text-white">{rec.productName}</h4>
                            <p className="text-xs font-bold text-slate-500">Активно вещество: {rec.activeSubstance}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 block">Доза на дка</span>
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{rec.dosePerDa} {rec.doseUnit}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/80 space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">Общо за масив ({aiResults.areaDecares} дка):</span>
                            <span className="text-slate-900 dark:text-white font-black">{rec.totalNeeded} {rec.unitOfMeasure}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">Наличност в Склад:</span>
                            <span className={cn("font-black", rec.hasSufficientStock ? "text-emerald-600" : "text-amber-600")}>
                              {rec.availableStock.toFixed(2)} {rec.stockUnit}
                            </span>
                          </div>
                          {!rec.hasSufficientStock && (
                            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              ⚠️ Внимание: Наличността е недостатъчна. При запис ще се генерира предупреждение или отрицателно салдо.
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                          &ldquo;{rec.agronomistRationale}&rdquo;
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAcceptAiRecommendation(rec)}
                        disabled={saving}
                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        <span>⚡ Приеми препоръката и запази в Дневник + Авто-изписване от Склад</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </SitePageShell>
  );
}
