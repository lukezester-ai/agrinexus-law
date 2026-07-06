"use client";

import { useState, useEffect, useRef } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { MapPin, Plus, Edit, Trash2, Save, Upload, Loader2, Map, Download } from "lucide-react";

type Field = {
  id: string;
  name: string;
  areaDecares: number;
  cadastralId: string;
  physicalBlockId: string;
  crop: string;
  cropVariety: string;
  soilType: string;
  ownershipType: string;
  ownerName: string;
  geometry: any;
  centroid: { lat: number; lng: number } | null;
  notes: string;
};

type GeoFeature = {
  type: "Feature";
  properties: Record<string, any>;
  geometry: { type: string; coordinates: any };
};

function emptyField(): Field {
  return { id: "", name: "", areaDecares: 0, cadastralId: "", physicalBlockId: "", crop: "", cropVariety: "", soilType: "", ownershipType: "own", ownerName: "", geometry: null, centroid: null, notes: "" };
}

export default function PolitaPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [editing, setEditing] = useState<Field | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Field>(emptyField());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<GeoFeature[] | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/fields");
    const data = await res.json();
    setFields(data.map((f: any) => ({ ...f, areaDecares: Number(f.areaDecares) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/fields", {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: editing.id }),
        });
      } else {
        await fetch("/api/fields", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
      }
      await load();
      setShowForm(false);
      setEditing(null);
      setForm(emptyField());
    } finally { setSaving(false); }
  };

  const handleEdit = (field: Field) => {
    setForm(field);
    setEditing(field);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/fields?id=${id}`, { method: "DELETE" });
    await load();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("Разчитане на файла...");
    setImporting(true);

    try {
      const shpModule = await import("shpjs");
      const shpFn = shpModule.default || shpModule;
      const geojson = await shpFn(file);
      const features = (geojson as any).features || [];
      if (features.length === 0) {
        setImportMsg("Няма намерени полигони в shapefile-а.");
        setImporting(false);
        return;
      }
      setImportPreview(features);
      setImportMsg(`Открити ${features.length} обекта. Прегледайте и потвърдете импорт.`);
      setImporting(false);
    } catch (err: any) {
      setImportMsg(`Грешка при разчитане: ${err.message}`);
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/fields/import", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ features: importPreview }),
      });
      const result = await res.json();
      setImportMsg(result.message || `Импортирани ${result.imported} парцела.`);
      setImportPreview(null);
      await load();
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setImportMsg(`Грешка: ${err.message}`);
    } finally { setImporting(false); }
  };

  useEffect(() => {
    if (!importPreview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 300 * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allCoords: number[][] = [];
    for (const f of importPreview) {
      const coords = f.geometry?.coordinates?.[0];
      if (coords) allCoords.push(...coords.map((c: number[]) => [c[0], c[1]]));
    }

    if (allCoords.length === 0) return;
    const lngs = allCoords.map((c: any) => c[0]);
    const lats = allCoords.map((c: any) => c[1]);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const rangeLng = maxLng - minLng || 1, rangeLat = maxLat - minLat || 1;
    const pad = 20;
    const w = canvas.width / 2 - pad * 2;
    const h = 300 - pad * 2;
    const scale = Math.min(w / rangeLng, h / rangeLat);

    ctx.strokeStyle = "#059669";
    ctx.fillStyle = "rgba(5, 150, 105, 0.15)";
    ctx.lineWidth = 2;

    for (const f of importPreview) {
      const ring = f.geometry?.coordinates?.[0];
      if (!ring || ring.length < 3) continue;
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const x = pad + (ring[i][0] - minLng) * scale;
        const y = pad + h - (ring[i][1] - minLat) * scale;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }, [importPreview]);

  return (
    <SitePageShell maxWidth="5xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Парцели и полета</p>
        <button onClick={() => { setShowForm(!showForm); setForm(emptyField()); setEditing(null); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus size={16} /> Нов парцел
        </button>
      </div>
    }>
      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име на парцела</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Площ (декари)</label>
              <input type="number" value={form.areaDecares || ""} onChange={(e) => setForm({ ...form, areaDecares: Number(e.target.value) })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Кадастрален номер</label>
              <input value={form.cadastralId} onChange={(e) => setForm({ ...form, cadastralId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Физически блок (ФБ)</label>
              <input value={form.physicalBlockId} onChange={(e) => setForm({ ...form, physicalBlockId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Култура</label>
              <input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="Пшеница"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип почва</label>
              <input value={form.soilType} onChange={(e) => setForm({ ...form, soilType: e.target.value })} placeholder="Чернозем"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Собственост</label>
              <select value={form.ownershipType} onChange={(e) => setForm({ ...form, ownershipType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="own">Собствен</option>
                <option value="rent">Аренда</option>
                <option value="lease">Наем</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Собственик</label>
              <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display flex items-center gap-3 text-2xl font-medium text-slate-950 dark:text-white">
                <Map className="text-teal-600 dark:text-teal-400" /> Карта на полетата
              </h1>
              <p className="mt-1 text-sm text-slate-500">Управление на земеделски парцели и физически блокове</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Upload size={16} /> Импорт на парцели от Shapefile (.zip)
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept=".zip,.shp" onChange={handleFile} className="block w-full max-w-xs text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" />
            {importPreview && importPreview.length > 0 && (
              <button onClick={handleImport} disabled={importing} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Импортирай {importPreview.length} парцела
              </button>
            )}
          </div>
          {importMsg && <p className="mt-2 text-xs text-slate-500">{importMsg}</p>}

          {importPreview && importPreview.length > 0 && (
            <div className="mt-4">
              <canvas ref={canvasRef} className="w-full rounded-xl border border-slate-200 dark:border-slate-700" style={{ height: 300 }} />
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
                {importPreview.slice(0, 8).map((f, i) => {
                  const name = f.properties?.NAME || f.properties?.name || f.properties?.ИМЕ || `Парцел ${i + 1}`;
                  return <div key={i} className="truncate rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">{name}</div>;
                })}
                {importPreview.length > 8 && <div className="rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">+{importPreview.length - 8} още</div>}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : fields.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <MapPin size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p>Все още няма добавени парцели. Импортирайте Shapefile или добавете ръчно.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="p-3">Име</th>
                  <th className="p-3">Площ (дка)</th>
                  <th className="p-3">Култура</th>
                  <th className="p-3">Собственост</th>
                  <th className="p-3">Координати</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {fields.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{f.name}</td>
                    <td className="p-3 text-slate-600">{f.areaDecares.toFixed(1)}</td>
                    <td className="p-3 text-slate-600">{f.crop || "—"}</td>
                    <td className="p-3 text-slate-600">{f.ownershipType === "own" ? "Собствен" : f.ownershipType === "rent" ? "Аренда" : "Наем"}</td>
                    <td className="p-3 font-mono text-xs text-slate-400">
                      {f.centroid ? `${f.centroid.lat.toFixed(4)}, ${f.centroid.lng.toFixed(4)}` : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(f)} className="text-teal-600 hover:text-teal-800"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
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
  );
}
