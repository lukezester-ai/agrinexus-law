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

type Params = { params: Promise<{ id: string }> };

function statusLabel(status: "active" | "cancelled") {
  return status === "active" ? "Актуален" : "Отменен";
}

export default async function DocumentPage({ params }: Params) {
  const { id } = await params;
  const doc = getKnowledgeDocumentById(id);

  if (!doc) {
    notFound();
  }

  const status = getDocumentStatus(doc);
  const summary = summarizeDocumentInFiveSentences(doc);
  const versions = getDocumentVersionHistory(doc);
  const related = getRelatedDocuments(doc);

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
              {doc.category} · {doc.effectiveDate}
            </span>
          </div>
          <h1 className="text-2xl font-semibold dark:text-stone-50">{doc.title}</h1>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`/api/documents/${doc.id}/download`}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700"
            >
              <Download size={15} />
              Свали документа
            </a>
            <a
              href={getKnowledgeSourceUrl(doc)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
            >
              Оригинал
              <ExternalLink size={14} />
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6 dark:border-violet-900 dark:bg-violet-950/40">
          <h2 className="text-sm font-semibold text-violet-900 dark:text-violet-200">AI обобщение (5 изречения)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-violet-900/95 dark:text-violet-200">
            {summary.map((sentence, idx) => (
              <li key={`${doc.id}-${idx}`}>{sentence}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-sm font-semibold">Пълен текст</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {doc.content}
          </pre>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <h3 className="text-sm font-semibold">История на версиите</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {versions.map((item) => (
                <li key={item.id} className="rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {item.effectiveDate} · {statusLabel(item.status)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <h3 className="text-sm font-semibold">Свързани документи</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/doc/${item.id}`} className="block rounded-lg border border-stone-200 px-3 py-2 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{item.category}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
