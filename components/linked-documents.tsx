"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Download, ExternalLink, Trash2, Loader2, Paperclip } from "lucide-react";

type Document = {
  id: string; name: string; docType: string; fileUrl: string;
  fileType: string | null; fileSize: string | null;
  description: string | null; createdAt: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LinkedDocuments({ module, entityId }: { module: string; entityId: string }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [desc, setDesc] = useState("");

  const load = async () => {
    if (!entityId) return;
    setLoading(true);
    const res = await fetch(`/api/farm/documents?module=${module}&entity_id=${entityId}`);
    const d = await res.json();
    setDocs(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [entityId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);
      fd.append("doc_type", "other");
      fd.append("linked_module", module);
      fd.append("linked_entity_id", entityId);
      fd.append("description", desc);
      await fetch("/api/farm/documents", { method: "POST", body: fd });
      await load();
      setShowUpload(false); setDesc("");
      if (fileRef.current) fileRef.current.value = "";
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Изтриване на документа?")) return;
    await fetch(`/api/farm/documents/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="flex items-center gap-2 text-sm font-bold"><Paperclip size={16} className="text-emerald-600" /> Документи ({docs.length})</h3>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
          <Upload size={12} /> Прикачи
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <input ref={fileRef} type="file" required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-900" />
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Описание..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-900" />
            </div>
            <button type="submit" disabled={uploading}
              className="flex items-center gap-1 rounded-lg bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Качи
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
      ) : docs.length === 0 ? (
        <p className="p-4 text-center text-xs text-slate-400">Няма прикачени документи.</p>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={16} className="shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-slate-400">
                    {doc.fileSize ? formatFileSize(Number(doc.fileSize)) : "—"}
                    {doc.description ? ` · ${doc.description}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600" title="Отвори">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => handleDelete(doc.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-500" title="Изтрий">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
