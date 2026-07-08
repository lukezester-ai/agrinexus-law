"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { FileText, Plus, Save, Trash2, Edit, Loader2, Search, X, FileSignature, Eye, Printer } from "lucide-react";

type Template = {
  id: string; name: string; type: string; content: string; description: string | null; isActive: boolean;
};

type Contract = {
  contract: {
    id: string; templateId: string | null; counterpartyId: string | null;
    contractNumber: string; type: string; status: string;
    issueDate: string; expiryDate: string | null;
    content: string; filledData: any; documentId: string | null; notes: string | null;
  };
  templateName: string | null; counterpartyName: string | null;
};

const CONTRACT_TYPES: Record<string, string> = {
  lease: "Аренда", machine_rental: "Наем на машина", sale: "Продажба", service: "Услуга", other: "Друг",
};

const CONTRACT_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Чернова", color: "bg-slate-100 text-slate-600" },
  active: { label: "Активен", color: "bg-green-100 text-green-700" },
  expired: { label: "Изтекъл", color: "bg-red-100 text-red-700" },
  terminated: { label: "Прекратен", color: "bg-amber-100 text-amber-700" },
};

const DEFAULT_TEMPLATES: Record<string, string> = {
  lease: `ДОГОВОР ЗА АРЕНДА НА ЗЕМЕДЕЛСКА ЗЕМЯ

Днес, {{date}} г., в град {{city}},

между:

1. {{lessorName}}, ЕИК: {{lessorEik}}, адрес: {{lessorAddress}}, наричан/а за краткост „АРЕНДОДАТЕЛ"

и

2. {{clientName}}, ЕИК: {{clientEik}}, адрес: {{clientAddress}}, представлявано от {{clientContact}}, наричано за краткост „АРЕНДАТОР"

на основание чл. 37, ал. 1 от Закона за собствеността и земеделската земя, се сключи настоящият договор за:

I. ПРЕДМЕТ НА ДОГОВОРА
1.1. Арендодателят предоставя, а Арендаторът приема за временно и възмездно ползване следния имот:
- Земеделска земя в местност: {{fieldLocation}}
- Площ: {{fieldArea}} дка
- Кадастрален номер: {{cadastralId}}

II. СРОК
2.1. Договорът се сключва за срок от {{duration}} години, считано от {{date}} г.

III. АРЕНДНО ПЛАЩАНЕ
3.1. Годишното арендно плащане е в размер на {{amount}} лв.

IV. ПРАВА И ЗАДЪЛЖЕНИЯ
4.1. Арендаторът има право да обработва земята и да прибира продукцията.
4.2. Арендаторът заплаща дължимите данъци и такси за имота.

V. ПРЕКРАТЯВАНЕ
5.1. Договорът се прекратява с изтичане на срока, по взаимно съгласие или при неизпълнение.

Настоящият договор се състави в два еднообразни екземпляра – по един за всяка от страните.

АРЕНДОДАТЕЛ: ____________________
АРЕНДАТОР: ______________________`,
  machine_rental: `ДОГОВОР ЗА НАЕМ НА ЗЕМЕДЕЛСКА МАШИНА

Днес, {{date}} г.,

между:

1. {{clientName}}, ЕИК: {{clientEik}}, адрес: {{clientAddress}}, наричан/а „НАЕМОДАТЕЛ"

и

2. {{lesseeName}}, ЕИК: {{lesseeEik}}, адрес: {{lesseeAddress}}, наричан/а „НАЕМАТЕЛ"

I. ПРЕДМЕТ
1.1. Наемодателят предоставя на Наемателя за временно ползване следната машина:
- Тип: {{machineType}}
- Марка/модел: {{machineModel}}
- Рег. номер: {{machinePlate}}

II. СРОК И ЦЕНА
2.1. Срок на наема: {{duration}} дни/месеца.
2.2. Наемна цена: {{amount}} лв.

III. ЗАДЪЛЖЕНИЯ
3.1. Наемателят отговаря за горивото и оператора.
3.2. Наемателят носи отговорност за повреди, причинени по негово вино.

НАЕМОДАТЕЛ: ____________________
НАЕМАТЕЛ: ______________________`,
  sale: `ДОГОВОР ЗА ПОКУПКО-ПРОДАЖБА НА ЗЕМЕДЕЛСКА ПРОДУКЦИЯ

Днес, {{date}} г.,

между:

1. {{sellerName}}, ЕИК: {{sellerEik}}, адрес: {{sellerAddress}}, наричан/а „ПРОДАВАЧ"

и

2. {{clientName}}, ЕИК: {{clientEik}}, адрес: {{clientAddress}}, наричан/а „КУПУВАЧ"

I. ПРЕДМЕТ
1.1. Продавачът продава, а Купувачът купува следната продукция:
- Продукт: {{productName}}
- Количество: {{quantity}} {{unit}}
- Цена: {{unitPrice}} лв/{{unit}}
- Обща стойност: {{amount}} лв

II. ПЛАЩАНЕ
2.1. Плащането се извършва по банков път в срок до {{paymentTerm}} дни.

III. ПРЕДАВАНЕ
3.1. Продукцията се предава на място: {{deliveryPlace}} на дата {{deliveryDate}}.

ПРОДАВАЧ: ____________________
КУПУВАЧ: ____________________`,
};

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", type: "lease", content: "", description: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/farm/contracts/templates");
    const d = await res.json();
    setTemplates(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, type: form.type, content: form.content, description: form.description || null };
      if (editing) {
        await fetch(`/api/farm/contracts/templates/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/farm/contracts/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      await load(); setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на шаблона?")) return;
    await fetch(`/api/farm/contracts/templates/${id}`, { method: "DELETE" });
    await load();
  };

  const useDefault = (type: string) => {
    setForm({ ...form, type, content: DEFAULT_TEMPLATES[type] || "", name: CONTRACT_TYPES[type] || type });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  return (<>
    <div className="mb-4 flex items-center justify-between gap-2">
      <p className="text-xs text-slate-500">{templates.length} шаблона</p>
      <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", type: "lease", content: "", description: "" }); }}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Нов шаблон
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><FileText size={18} className="text-emerald-600" /> {editing ? "Редактиране" : "Нов"} шаблон</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Бързо създаване:</span>
          {Object.entries(DEFAULT_TEMPLATES).map(([k]) => (
            <button key={k} type="button" onClick={() => useDefault(k)}
              className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">{[k]}</button>
          ))}
        </div>
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
              {Object.entries(CONTRACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Съдържание (използвайте {'{{variable}}'} за динамични полета)</span>
            </label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={16}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editing ? "Запази" : "Създай"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
        </div>
      </form>
    )}

    {templates.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <FileText size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма шаблони. Създайте нов шаблон или използвайте някой от стандартните.</p>
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="group relative rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-bold">{t.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{CONTRACT_TYPES[t.type]}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(t); setForm({ name: t.name, type: t.type, content: t.content, description: t.description || "" }); setShowForm(true); }} className="text-emerald-600 hover:text-emerald-800"><Edit size={14} /></button>
                <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
              </div>
            </div>
            {t.description && <p className="mb-2 text-xs text-slate-500">{t.description}</p>}
            <p className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-400">{t.content.substring(0, 200)}...</p>
          </div>
        ))}
      </div>
    )}
  </>);
}

function ContractsTab() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [counterparties, setCounterparties] = useState<{ id: string; name: string; eik: string | null; address: string | null; city: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({
    templateId: "", counterpartyId: "", type: "lease",
    expiryDate: "", notes: "", filledDataStr: "{}",
  });
  const [fields, setFields] = useState<{ id: string; name: string; areaDecares: number; crop: string | null; cadastralId: string | null }[]>([]);

  const load = async () => {
    setLoading(true);
    const [resC, resT, resCp, resF] = await Promise.all([
      fetch("/api/farm/contracts"),
      fetch("/api/farm/contracts/templates"),
      fetch("/api/accounting/counterparties"),
      fetch("/api/farm/fields"),
    ]);
    const [dC, dT, dCp, dF] = await Promise.all([resC.json(), resT.json(), resCp.json(), resF.json()]);
    setContracts(Array.isArray(dC) ? dC : []);
    setTemplates(Array.isArray(dT) ? dT : []);
    setCounterparties(Array.isArray(dCp) ? dCp : []);
    setFields(Array.isArray(dF) ? dF.filter((f: any) => f.isActive !== false) : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const filledData = JSON.parse(form.filledDataStr || "{}");
      const payload = {
        templateId: form.templateId || null,
        counterpartyId: form.counterpartyId || null,
        type: form.type,
        expiryDate: form.expiryDate || null,
        notes: form.notes || null,
        filledData,
      };
      await fetch("/api/farm/contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await load(); setShowForm(false);
      setForm({ templateId: "", counterpartyId: "", type: "lease", expiryDate: "", notes: "", filledDataStr: "{}" });
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/farm/contracts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на договора?")) return;
    await fetch(`/api/farm/contracts/${id}`, { method: "DELETE" });
    await load();
  };

  const generateFilledDataHint = () => {
    const hint: Record<string, string> = {
      lessorName: "Име на арендодател",
      lessorEik: "ЕИК на арендодател",
      lessorAddress: "Адрес на арендодател",
      lesseeName: "Име на наемател",
      lesseeEik: "ЕИК на наемател",
      lesseeAddress: "Адрес на наемател",
      sellerName: "Име на продавач",
      sellerEik: "ЕИК на продавач",
      sellerAddress: "Адрес на продавач",
      city: "Град",
      fieldLocation: "Местност",
      fieldArea: "Площ (дка)",
      cadastralId: "Кадастрален номер",
      duration: "Срок",
      amount: "Сума (лв)",
      machineType: "Тип машина",
      machineModel: "Марка/модел",
      machinePlate: "Рег. номер",
      productName: "Продукт",
      quantity: "Количество",
      unit: "Мерна единица",
      unitPrice: "Ед. цена",
      paymentTerm: "Срок за плащане (дни)",
      deliveryPlace: "Място на предаване",
      deliveryDate: "Дата на предаване",
    };
    return hint;
  };

  const fillWithFieldData = () => {
    try {
      const existing = JSON.parse(form.filledDataStr || "{}");
      const first = fields[0];
      if (first) {
        existing.fieldArea = String(Number(first.areaDecares).toFixed(2));
        existing.fieldLocation = first.name;
        existing.cadastralId = first.cadastralId || "";
      }
      setForm({ ...form, filledDataStr: JSON.stringify(existing, null, 2) });
    } catch {}
  };

  const filtered = contracts.filter((c) => {
    const sMatch = !filterStatus || c.contract.status === filterStatus;
    const qMatch = !search ||
      c.contract.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.counterpartyName?.toLowerCase().includes(search.toLowerCase());
    return sMatch && qMatch;
  });

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

  return (<>
    <div className="mb-4 flex items-center justify-end gap-2">
      <button onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        <Plus size={16} /> Нов договор
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleCreate} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 font-bold"><FileSignature size={18} className="text-emerald-600" /> Генериране на договор</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Шаблон</label>
            <select value={form.templateId} onChange={(e) => {
              const tpl = templates.find((t) => t.id === e.target.value);
              setForm({ ...form, templateId: e.target.value, type: tpl?.type || form.type });
            }}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              <option value="">Без шаблон</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({CONTRACT_TYPES[t.type]})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Контрагент</label>
            <select value={form.counterpartyId} onChange={(e) => {
              const cp = counterparties.find((c) => c.id === e.target.value);
              setForm({ ...form, counterpartyId: e.target.value });
              if (cp) {
                try {
                  const existing = JSON.parse(form.filledDataStr || "{}");
                  existing.clientName = cp.name;
                  existing.clientEik = cp.eik || "";
                  existing.clientAddress = cp.address || "";
                  existing.clientCity = cp.city || "";
                  setForm({ ...form, counterpartyId: e.target.value, filledDataStr: JSON.stringify(existing, null, 2) });
                } catch {}
              }
            }}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              <option value="">Избери контрагент</option>
              {counterparties.map((cp) => <option key={cp.id} value={cp.id}>{cp.name} ({cp.eik || "—"})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип договор</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
              {Object.entries(CONTRACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Срок до</label>
            <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Данни за попълване (JSON)</label>
              <button type="button" onClick={fillWithFieldData}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200">Вмъкни данни от първо поле</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <textarea value={form.filledDataStr} onChange={(e) => setForm({ ...form, filledDataStr: e.target.value })}
                rows={8}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
              <div className="col-span-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <p className="mb-1 font-bold">Налични променливи:</p>
                {Object.entries(generateFilledDataHint()).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => {
                    try {
                      const existing = JSON.parse(form.filledDataStr || "{}");
                      existing[k] = "";
                      setForm({ ...form, filledDataStr: JSON.stringify(existing, null, 2) });
                    } catch {}
                  }}
                    className="mr-1 inline-block rounded bg-white px-1.5 py-0.5 text-xs hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-slate-600">
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Бележки</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16} />} Генерирай
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
        </div>
      </form>
    )}

    {preview && (
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Преглед на договор</h3>
          <button onClick={() => setPreview(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-6 font-mono text-xs dark:border-slate-700 dark:bg-slate-950">
          {preview}
        </div>
        <button onClick={() => window.print()} className="mt-3 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 dark:bg-white dark:text-slate-950">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>
    )}

    <div className="mb-4 flex items-center gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по номер или контрагент..."
          className="w-full bg-transparent text-sm outline-none dark:text-white" />
        {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
      </div>
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <option value="">Всички статуси</option>
        {Object.entries(CONTRACT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
    </div>

    {filtered.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        <FileSignature size={40} className="mx-auto mb-3 text-slate-300" />
        <p>Няма договори. Генерирайте първия договор от шаблон.</p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-emerald-950/20">
          <h2 className="flex items-center gap-2 font-bold"><FileSignature size={18} className="text-emerald-600" /> Договори ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
              <tr><th className="p-3">Номер</th><th className="p-3">Тип</th><th className="p-3">Контрагент</th><th className="p-3">Дата</th><th className="p-3">Срок до</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(({ contract: c, templateName, counterpartyName }) => {
                const st = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.draft;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs">{c.contractNumber}</td>
                    <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{CONTRACT_TYPES[c.type] || c.type}</span></td>
                    <td className="p-3 font-bold">{counterpartyName || "—"}</td>
                    <td className="p-3 text-xs">{new Date(c.issueDate).toLocaleDateString("bg-BG")}</td>
                    <td className="p-3 text-xs">{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("bg-BG") : "—"}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setPreview(c.content)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600"><Eye size={14} /></button>
                        {c.status === "draft" && <button onClick={() => handleStatusChange(c.id, "active")} className="rounded-lg px-2 py-1 text-xs font-bold text-green-600 hover:bg-green-50">Активирай</button>}
                        {c.status === "active" && <button onClick={() => handleStatusChange(c.id, "expired")} className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Изтекъл</button>}
                        <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>);
}

export default function DogovoriPage() {
  const [tab, setTab] = useState<"templates" | "contracts">("templates");

  return (
    <SitePageShell maxWidth="6xl" subheader={
      <p className="text-sm font-semibold">Договори с контрагенти</p>
    }>
      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button onClick={() => setTab("templates")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "templates" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <FileText size={16} /> Шаблони
        </button>
        <button onClick={() => setTab("contracts")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "contracts" ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <FileSignature size={16} /> Договори
        </button>
      </div>

      {tab === "templates" && <TemplatesTab />}
      {tab === "contracts" && <ContractsTab />}
    </SitePageShell>
  );
}
