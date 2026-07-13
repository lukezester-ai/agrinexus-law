import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";
import {
  getDocumentStatus,
  getDocumentVersionHistory,
  getKnowledgeDocumentById,
  getRelatedDocuments,
  summarizeDocumentInFiveSentences,
} from "@/lib/knowledge/document-detail";
import { getPublicDocumentById, getPublicDocumentRecord, isPublicDocumentId } from "@/lib/knowledge/public-documents-search";

type Params = { params: Promise<{ id: string }> };

function statusLabel(status: "active" | "cancelled") {
  return status === "active" ? "Актуален" : "Отменен";
}

export default async function DocumentPage({ params }: Params) {
  const { id } = await params;
  const doc = isPublicDocumentId(id)
    ? await getPublicDocumentById(id)
    : getKnowledgeDocumentById(id);

  if (!doc) {
    notFound();
  }

  const status = getDocumentStatus(doc);
  const summary = summarizeDocumentInFiveSentences(doc);
  const versions = isPublicDocumentId(id) ? [] : getDocumentVersionHistory(doc);
  const related = isPublicDocumentId(id) ? [] : getRelatedDocuments(doc);
  const sourceUrl = getKnowledgeSourceUrl(doc);
  const publicRecord = isPublicDocumentId(id) ? await getPublicDocumentRecord(id) : null;
  const hasStoredFile = Boolean(publicRecord?.storage_path);

  return (
    <SitePageShell
      maxWidth="5xl"
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/search" className="text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
            ← Към търсенето
          </Link>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Документ</span>
        </div>
      }
    >
      <div className="space-y-8">
        <section className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-8 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider ${
                status === "active"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span>{statusLabel(status)}</span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {doc.category} · {doc.type} · в сила от {doc.effectiveDate}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
            {doc.title}
          </h1>
          
          <div className="my-6 border-t border-slate-200/80 dark:border-slate-800" />
          
          <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-200">
            {summary}
          </p>
          
          {isPublicDocumentId(id) ? (
            <div className="mt-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3">
              <span>💡 {hasStoredFile
                ? "Индексиран държавен документ с локално архивирано копие — можете да изтеглите PDF веднага или да прегледате оригинала в сайта на институцията."
                : "Индексиран държавен документ от нормативния архив. Отворете официалния източник за пълен текст."}</span>
            </div>
          ) : null}
          
          <div className="mt-8 flex flex-wrap gap-3.5">
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-500/25 hover:brightness-110 transition-all active:scale-95"
              >
                <ExternalLink size={18} />
                <span>Официален източник на документа</span>
              </a>
            ) : null}
            {hasStoredFile || !isPublicDocumentId(id) ? (
              <a
                href={`/api/documents/${doc.id}/download`}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/90 bg-slate-50/80 px-5 py-3 text-sm font-extrabold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm active:scale-95"
              >
                <Download size={18} />
                <span>{hasStoredFile ? "Изтегли PDF от архива" : "Изтегли резюме (.txt)"}</span>
              </a>
            ) : null}
          </div>
        </section>

        {versions.length > 0 ? (
          <section className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-8 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">История на версиите</h2>
            <ul className="mt-4 space-y-3">
              {versions.map((v) => (
                <li key={v.id} className="card-hover-pro rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between transition-all">
                  <Link href={`/doc/${v.id}`} className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                    {v.title}
                  </Link>
                  <span className="ml-3 rounded-full bg-slate-200/80 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">{v.effectiveDate}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-8 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Свързани наредби и процедури</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/doc/${r.id}`}
                    className="card-hover-pro block rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 text-sm font-bold text-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:text-emerald-400 transition-all"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </SitePageShell>
  );
}
