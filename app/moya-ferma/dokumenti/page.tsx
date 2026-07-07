"use client";

import { useState, useEffect, useRef } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { FileText, Upload, Search, X, Trash2, Pin, PinOff, Download, ExternalLink, Loader2, FolderOpen, Filter, ChevronDown } from "lucide-react";

type Document = {
  id: string; name: string; docType: string; category: string | null;
  fileUrl: string; fileType: string | null; fileSize: string | null;
  linkedModule: string | null; linkedEntityId: string | null;
  description: string | null; tags: string | null;
  isPinned: boolean; uploadedBy: string | null;
  createdAt: string; updatedAt: string;
};

const DOC_TYPES: Record<string, string> = {
  contract: "Договор",
  dzf: "ДФЗ",
  protocol: "Протокол",
  invoice: "Фактура",
  report: "Доклад",
  permit: "Разрешително",
  insurance: "Застраховка",
  tax: "Данъчен",
  certificate: "Сертификат",
  other: "Друг",
};

const CATEGORIES = [
  "Земя/Парцели", "Култури/Реколта", "Машини", "Химизация",
  "ЧР/ТРЗ", "Финанси/Счетоводство", "Данъци/НАП", "ДФЗ/Субсидии",
  "Застраховки", "Друго",
];

const MODULES = [
  { value: "polita", label: "Парцели" },
  { value: "sklad", label: "Склад" },
  { value: "harvest", label: "Реколта" },
  { value: "machines", label: "Машини" },
  { value: "chemicals", label: "Химизация" },
  { value: "hr", label: "ЧР" },
  { value: "invoices", label: "Фактури" },
  { value: "counterparties", label: "Контрагенти" },
  { value: "bank", label: "Банки" },
  { value: "other", label: "Друго" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string | null): string {
  if (!type) return "📄";
  if (type.includes("pdf")) return "📕";
  if (type.includes("image")) return "🖼️";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  return "📄";
}

function DocTypeBadge({ type }: { type: string }) {
  const label = DOC_TYPES[type] || type;
  const colors: Record<string, string> = {
    contract: "bg-blue-100 text-blue-700",
    dzf: "bg-green-100 text-green-700",
    protocol: "bg-purple-100 text-purple-700",
    invoice: "bg-amber-100 text-amber-700",
    report: "bg-slate-100 text-slate-700",
    permit: "bg-red-100 text-red-700",
    insurance: "bg-pink-100 text-pink-700",
    tax: "bg-orange-100 text-orange-700",
    certificate: "bg-teal-100 text-teal-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colors[type] || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

export default function DokumentiPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    name: "", docType: "other", category: "", description: "",
    linkedModule: "", tags: "", isPinned: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/farm/documents");
      const d = await res.json();
      setDocs(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", uploadForm.name || file.name);
      fd.append("doc_type", uploadForm.docType);
      fd.append("category", uploadForm.category);
      fd.append("description", uploadForm.description);
      fd.append("linked_module", uploadForm.linkedModule);
      fd.append("tags", uploadForm.tags);
      fd.append("is_pinned", String(uploadForm.isPinned));
      await fetch("/api/farm/documents", { method: "POST", body: fd });
      await load();
      setShowUpload(false);
      setUploadForm({ name: "", docType: "other", category: "", description: "", linkedModule: "", tags: "", isPinned: false });
      if (fileRef.current) fileRef.current.value = "";
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на документа?")) return;
    await fetch(`/api/farm/documents/${id}`, { method: "DELETE" });
    await load();
  };

  const togglePin = async (doc: Document) => {
    await fetch(`/api/farm/documents/${doc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !doc.isPinned }),
    });
    await load();
  };

  const filtered = docs.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.tags?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || d.docType === filterType;
    const matchesCategory = !filterCategory || d.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const pinned = filtered.filter((d) => d.isPinned);
  const unpinned = filtered.filter((d) => !d.isPinned);

  return (
    <SitePageShell maxWidth="6xl" subheader={
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Документи и файлове</p>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Upload size={16} /> Качи документ
        </button>
      </div>
    }>
      {showUpload && (
        <form onSubmit={handleUpload} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 font-bold"><Upload size={18} className="text-emerald-600" /> Качване на документ</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Файл</label>
              <input ref={fileRef} type="file" required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име</label>
              <input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="Оставете празно за име на файла"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип документ</label>
              <select value={uploadForm.docType} onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Категория</label>
              <select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">—</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Свързан модул</label>
              <select value={uploadForm.linkedModule} onChange={(e) => setUploadForm({ ...uploadForm, linkedModule: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">—</option>
                {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
              <textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} rows={2}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Етикети (разделени със запетая)</label>
              <input value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} placeholder="напр. договор, аренда, 2025"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pin-upload" checked={uploadForm.isPinned} onChange={(e) => setUploadForm({ ...uploadForm, isPinned: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <label htmlFor="pin-upload" className="text-sm text-slate-700 dark:text-slate-300">Закачи отгоре</label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Качи
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Отказ</button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси по име, описание, етикети..."
            className="w-full bg-transparent text-sm outline-none dark:text-white" />
          {search && <button onClick={() => setSearch("")}><X size={16} className="text-slate-400" /></button>}
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">Всички типове</option>
          {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">Всички категории</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500 dark:border-slate-700">
          <FolderOpen size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-bold">Няма документи</p>
          <p className="mt-1">Качете първия документ с бутона "Качи документ"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-500"><Pin size={14} /> Закачени</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((doc) => <DocCard key={doc.id} doc={doc} onDelete={handleDelete} onTogglePin={togglePin} />)}
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unpinned.map((doc) => <DocCard key={doc.id} doc={doc} onDelete={handleDelete} onTogglePin={togglePin} />)}
          </div>
        </div>
      )}
    </SitePageShell>
  );
}

function DocCard({ doc, onDelete, onTogglePin }: { doc: Document; onDelete: (id: string) => void; onTogglePin: (doc: Document) => void }) {
  const isImage = doc.fileType?.startsWith("image/");
  const isPdf = doc.fileType === "application/pdf";

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button onClick={() => onTogglePin(doc)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800" title={doc.isPinned ? "Откачи" : "Закачи"}>
          {doc.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button onClick={() => onDelete(doc.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
          <Trash2 size={14} />
        </button>
      </div>

      {isImage ? (
        <img src={doc.fileUrl} alt={doc.name} className="mb-3 h-32 w-full rounded-xl object-cover" />
      ) : isPdf ? (
        <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <span className="text-4xl">📕</span>
        </div>
      ) : (
        <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
          <span className="text-4xl">{getFileIcon(doc.fileType)}</span>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-tight">{doc.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DocTypeBadge type={doc.docType} />
          {doc.category && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">{doc.category}</span>}
        </div>
        {doc.description && <p className="line-clamp-2 text-xs text-slate-500">{doc.description}</p>}
        {doc.tags && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.split(",").map((tag) => (
              <span key={tag.trim()} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{tag.trim()}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>{doc.fileSize ? formatFileSize(Number(doc.fileSize)) : "—"}</span>
          <span>{new Date(doc.createdAt).toLocaleDateString("bg-BG")}</span>
        </div>
      </div>

      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
        <Download size={14} /> Отвори <ExternalLink size={12} />
      </a>
    </div>
  );
}
