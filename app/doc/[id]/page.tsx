import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";
import {
  getDocumentStatus,
  getDocumentVersionHistory,
  getKnowledgeDocumentById,
  getRelatedDocuments,
  summarizeDocumentInFiveSentences,
} from "@/lib/knowledge/document-detail";
import { getPublicDocumentById, isPublicDocumentId } from "@/lib/knowledge/public-documents-search";

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

  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 border-b border-teal-100/80 bg-white/90 backdrop-blur-md shadow-sm dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/search" className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white">
            <ArrowLeft size={16} />
            Към търсенето
          </Link>
          <div className="text-sm font-medium dark:text-stone-100">Документ</div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
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
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {doc.category} · {doc.type} · {doc.effectiveDate}
            </span>
          </div>
          <h1 className="text-2xl font-semibold dark:text-stone-50">{doc.title}</h1>
          <p className="mt-4 text-sm leading-7 text-stone-700 dark:text-stone-300">{summary}</p>
          {isPublicDocumentId(id) ? (
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Това е индексиран държавен документ от ingest pipeline. Пълният текст е в RAG чата; отвори оригинала за PDF/HTML.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <ExternalLink size={16} />
              Официален източник
            </a>
            {!isPublicDocumentId(id) ? (
              <a
                href={`/api/documents/${doc.id}/download`}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium dark:border-stone-600"
              >
                <Download size={16} />
                Изтегли резюме (.txt)
              </a>
            ) : null}
          </div>
        </section>

        {versions.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold dark:text-stone-50">Версии</h2>
            <ul className="mt-3 space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="rounded-lg border border-stone-200 p-3 text-sm dark:border-stone-700">
                  <Link href={`/doc/${v.id}`} className="font-medium text-teal-700 dark:text-teal-400">
                    {v.title}
                  </Link>
                  <span className="ml-2 text-stone-500">{v.effectiveDate}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold dark:text-stone-50">Свързани документи</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/doc/${r.id}`}
                    className="block rounded-lg border border-stone-200 p-3 text-sm hover:border-teal-400 dark:border-stone-700"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
