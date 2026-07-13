"use client";

import { useState } from "react";
import { Upload, FileText, CircleCheck, AlertCircle, Archive, Loader2 } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { AiLeaderPanel } from "@/components/ai-leader-panel";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("ДФЗ");
  const [category, setCategory] = useState("Нормативни актове");
  const [docType, setDocType] = useState("regulation");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));

  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [ingestToken, setIngestToken] = useState("");

  const [archiveRunning, setArchiveRunning] = useState(false);
  const [archiveStatus, setArchiveStatus] = useState<"idle" | "success" | "error">("idle");
  const [archiveMessage, setArchiveMessage] = useState("");

  const handleRunArchiveAgent = async () => {
    if (!ingestToken.trim()) {
      setArchiveStatus("error");
      setArchiveMessage("Въведете INGEST_ADMIN_TOKEN.");
      return;
    }
    setArchiveRunning(true);
    setArchiveStatus("idle");
    setArchiveMessage("");
    try {
      const res = await fetch("/api/ingest/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ingest-token": ingestToken.trim(),
        },
        body: JSON.stringify({
          archiveAgent: true,
          limitPerSource: 8,
          reindex: true,
          reindexLimit: 35,
          syncSearch: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Archive agent failed");
      const stored = data.totals?.stored ?? 0;
      const fetched = data.totals?.fetched ?? 0;
      setArchiveStatus("success");
      setArchiveMessage(
        `Document Archive Agent завърши: ${stored}/${fetched} записани. Reindex: ${data.reindex?.reason === "enabled" ? "да" : "не"}. Meili: ${data.searchSync?.synced ?? 0} docs.`,
      );
    } catch (err) {
      setArchiveStatus("error");
      setArchiveMessage(err instanceof Error ? err.message : "Грешка при archive agent.");
    } finally {
      setArchiveRunning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Моля, изберете PDF файл.");
      return;
    }

    if (!ingestToken.trim()) {
      setStatus("error");
      setMessage("Въведете админ токена (INGEST_ADMIN_TOKEN от .env.local), за да може сървърът да приеме качването.");
      return;
    }

    setUploading(true);
    setStatus("idle");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("institution", institution);
    formData.append("category", category);
    formData.append("docType", docType);
    formData.append("effectiveDate", effectiveDate);

    try {
      const res = await fetch("/api/ingest/upload", {
        method: "POST",
        headers: { "x-ingest-token": ingestToken.trim() },
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Грешка при качване.");
      }

      setStatus("success");
      setMessage(`Документът е качен и индексиран успешно! Създадени са ${data.chunksCreated} парчета.`);
      
      // Clear form
      setFile(null);
      setTitle("");
      (document.getElementById("file-upload") as HTMLInputElement).value = "";
      
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Възникна неочаквана грешка.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SitePageShell
      maxWidth="3xl"
      subheader={
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Админ · Качване и индексиране (RAG)</p>
      }
    >
        <div className="glass-panel rounded-3xl overflow-hidden mb-8 p-8">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Админ токен (INGEST_ADMIN_TOKEN) *</label>
          <input
            type="password"
            autoComplete="off"
            value={ingestToken}
            onChange={(e) => setIngestToken(e.target.value)}
            placeholder="Стойността от .env.local"
            className="mt-2 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition font-mono text-sm"
          />
        </div>

        <AiLeaderPanel ingestToken={ingestToken} />

        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl overflow-hidden mb-8">
          <div className="p-8 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
            <h2 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
                <Archive size={22} />
              </div>
              <span>Document Archive Agent</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-3 text-sm font-medium leading-relaxed">
              Автоматично изтегляне от ДФЗ/МЗХ sitemap → архив → RAG reindex → Meili sync.
              Същият pipeline като cron <code className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono">/api/ingest/cron</code>.
            </p>
          </div>
          <div className="p-8 space-y-4">
            {archiveStatus === "success" && (
              <div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center gap-3 text-sm border border-teal-200 dark:border-teal-800/50 font-semibold shadow-sm">
                <CircleCheck size={18} /> {archiveMessage}
              </div>
            )}
            {archiveStatus === "error" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-3 text-sm border border-rose-200 dark:border-rose-800/50 font-semibold shadow-sm">
                <AlertCircle size={18} /> {archiveMessage}
              </div>
            )}
            <button
              type="button"
              disabled={archiveRunning || !ingestToken.trim()}
              onClick={() => void handleRunArchiveAgent()}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {archiveRunning ? (
                <><Loader2 size={20} className="animate-spin" /> <span>Archive Agent работи и синхронизира…</span></>
              ) : (
                <><Archive size={20} /> <span>Стартирай Archive Agent (ingest + reindex)</span></>
              )}
            </button>
          </div>
        </div>

        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white flex items-center gap-3">
              <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-2 text-teal-600 dark:text-teal-400">
                <Upload size={24} />
              </div>
              <span>Качване на нов нормативен документ</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 text-sm font-medium leading-relaxed">
              Файлът ще бъде автоматично сканиран, разделен на логически части и качен в RAG базата на AgriNexus.
              Нужен е същият админ токен като за <code className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono">/api/rag/reindex</code> (<code className="text-xs font-mono">INGEST_ADMIN_TOKEN</code>).
            </p>
          </div>

          <form onSubmit={handleUpload} className="p-8 grid gap-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Заглавие на документа *</label>
                <input 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Напр. Наръчник за директни плащания 2024"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Институция</label>
                <input 
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Категория</label>
                <input 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип документ</label>
                <select 
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                >
                  <option value="regulation">Наредба / Закон</option>
                  <option value="scheme">Схема / Мярка</option>
                  <option value="procedure">Процедура / Указание</option>
                  <option value="deadline">Срокове</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">В сила от</label>
                <input 
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-teal-500 dark:hover:border-teal-500 transition-all cursor-pointer relative group bg-slate-50/30 dark:bg-slate-900/30">
              <input 
                id="file-upload"
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="mx-auto text-slate-400 group-hover:text-teal-500 transition-colors mb-4" size={48} />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                {file ? file.name : "Кликнете или плъзнете PDF файл тук"}
              </p>
              {file && <p className="text-xs text-slate-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>

            {status === "success" && (
              <div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center gap-3 text-sm font-bold border border-teal-200 dark:border-teal-800/50">
                <CircleCheck size={18} /> {message}
              </div>
            )}

            {status === "error" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-3 text-sm font-bold border border-rose-200 dark:border-rose-800/50">
                <AlertCircle size={18} /> {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={uploading || !file || !title.trim() || !ingestToken.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover-elevate"
            >
              {uploading ? (
                <><span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> Обработка и индексиране...</>
              ) : (
                <><Upload size={18} /> Качи и Индексирай</>
              )}
            </button>
          </form>
        </div>
    </SitePageShell>
  );
}
