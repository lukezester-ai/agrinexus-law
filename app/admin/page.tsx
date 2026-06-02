"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, CircleCheck, AlertCircle } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";

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

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("agrinexus_ingest_admin_token");
      if (saved) setIngestToken(saved);
    } catch {
      /* ignore */
    }
  }, []);

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
      try {
        sessionStorage.setItem("agrinexus_ingest_admin_token", ingestToken.trim());
      } catch {
        /* ignore */
      }
      
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
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
            <h1 className="font-display text-3xl font-medium text-slate-950 dark:text-white flex items-center gap-3">
              <Upload className="text-teal-600" /> Качване на нов документ
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm leading-relaxed">
              Файлът ще бъде автоматично сканиран, разделен на логически части и качен в RAG базата.
              Нужен е същият админ токен като за <code className="text-xs bg-slate-200/80 dark:bg-slate-800 px-1 rounded">/api/rag/reindex</code> (<code className="text-xs">INGEST_ADMIN_TOKEN</code>).
            </p>
          </div>

          <form onSubmit={handleUpload} className="p-8 grid gap-8">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Админ токен за индексиране *</label>
              <input
                type="password"
                autoComplete="off"
                value={ingestToken}
                onChange={(e) => setIngestToken(e.target.value)}
                placeholder="Стойността на INGEST_ADMIN_TOKEN от .env.local"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Запазва се само в този браузър (sessionStorage) след успешно качване — не се изпраща към трети страни.
              </p>
            </div>

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
