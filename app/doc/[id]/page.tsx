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
        <section className="surface-card p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                status === "active"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {statusLabel(status)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {doc.category} · {doc.type} · {doc.effectiveDate}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{doc.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{summary}</p>
          {isPublicDocumentId(id) ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {hasStoredFile
                ? "Индексиран държавен документ с копие в архива — изтеглете PDF или отворете оригинала."
                : "Индексиран държавен документ от ingest pipeline. Отворете оригинала за пълния текст."}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                <ExternalLink size={16} />
                Официален източник
              </a>
            ) : null}
            {hasStoredFile || !isPublicDocumentId(id) ? (
              <a
                href={`/api/documents/${doc.id}/download`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:text-slate-100"
              >
                <Download size={16} />
                {hasStoredFile ? "Изтегли от архива" : "Изтегли резюме (.txt)"}
              </a>
            ) : null}
          </div>
        </section>

        {versions.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">Версии</h2>
            <ul className="mt-3 space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <Link href={`/doc/${v.id}`} className="font-medium text-teal-700 dark:text-teal-400">
                    {v.title}
                  </Link>
                  <span className="ml-2 text-slate-500">{v.effectiveDate}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">Свързани документи</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/doc/${r.id}`}
                    className="block rounded-xl border border-slate-200 p-3 text-sm text-slate-800 hover:border-teal-400 dark:border-slate-700 dark:text-slate-100"
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
