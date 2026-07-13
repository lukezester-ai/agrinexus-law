"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, ExternalLink, MessageCircle, Search, Sparkles } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";
import { isPublicDocumentId } from "@/lib/knowledge/public-documents-search";
import { getDocumentStatus } from "@/lib/knowledge/document-detail";

const CATEGORIES = [
  { id: "all", label: "Всички" },
  { id: "Директни плащания", label: "Директни плащания" },
  { id: "Екосхеми", label: "Екосхеми" },
  { id: "Обвързани плащания", label: "Обвързани" },
  { id: "Срокове", label: "Срокове" },
  { id: "Процедури", label: "Процедури" },
  { id: "Условност", label: "Условност" },
];

const SUGGESTED_QUERIES = [
  "Какво е БИСС",
  "Срокове за заявления 2026",
  "Биологично производство",
  "Млади фермери",
  "Екосхема за разнообразяване",
  "Подаване през ИСАК",
];

const TYPE_LABELS: Record<KnowledgeDoc["type"], string> = {
  scheme: "Схема",
  regulation: "Нормативен акт",
  procedure: "Процедура",
  deadline: "Срок",
  video: "Видео",
  pdf: "PDF",
  lesson: "Урок",
};

type SearchResponse = {
  results?: KnowledgeDoc[];
  error?: string;
  engine?: "internal-ai" | "meili+internal" | "typesense+internal";
  aiSummary?: string | null;
};

function askAiHref(question: string) {
  const trimmed = question.trim();
  return trimmed ? `/?chatQ=${encodeURIComponent(trimmed)}#chat` : "/#chat";
}

async function findRelatedDoc(docId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/documents/related", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: docId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.related?.id ?? null;
  } catch {
    return null;
  }
}

function buildDocQuestion(query: string, doc: KnowledgeDoc) {
  return [
    `Обслужи ме по този документ: ${doc.title}.`,
    `Моето търсене беше: ${query || doc.title}.`,
    `Обясни какво означава, какви действия следват, какви срокове/рискове има и към кой официален източник да гледам.`,
    doc.sourceUrl ? `Оригинален източник: ${doc.sourceUrl}` : `Източник: ${doc.source}`,
  ].join(" ");
}

function engineLabel(engine: SearchResponse["engine"]) {
  if (engine === "typesense+internal") return "Typesense + вътрешна база + публични документи";
  if (engine === "meili+internal") return "Meilisearch + вътрешна база + публични документи";
  return "Вътрешна AI база + публични документи";
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [engine, setEngine] = useState<SearchResponse["engine"]>("internal-ai");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "date_desc" | "date_asc">("relevance");
  const searchAbortRef = useRef<AbortController | null>(null);

  const handleAiLink = useCallback((docId: string, fallbackQuestion: string) => {
    void (async () => {
      const relatedId = await findRelatedDoc(docId);
      if (relatedId) {
        window.location.href = `/doc/${relatedId}`;
      } else {
        window.location.href = askAiHref(fallbackQuestion);
      }
    })();
  }, []);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (q.length < 2) return;

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setHasSearched(true);
    setSearchError(null);
    setAiSummary(null);
    setOpenDetailId(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, category }),
        signal: controller.signal,
      });
      const data = (await response.json()) as SearchResponse;

      if (!response.ok) {
        throw new Error(data.error || "Грешка при търсене.");
      }

      setEngine(data.engine ?? "internal-ai");
      setAiSummary(data.aiSummary?.trim() || null);
      setResults(data.results ?? []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSearchError(error instanceof Error ? error.message : "Мрежова грешка. Опитай отново.");
      setResults([]);
    } finally {
      if (searchAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [category, query]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (q && q.length >= 2) {
      setQuery(q);
      void handleSearch(q);
    }
  }, [handleSearch]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const id = window.setTimeout(() => void handleSearch(q), 350);
    return () => window.clearTimeout(id);
  }, [category, handleSearch, query]);

  const visibleResults = useMemo(() => {
    const filtered = statusFilter === "all"
      ? results
      : results.filter((doc) => getDocumentStatus(doc) === statusFilter);

    return [...filtered].sort((a, b) => {
      if (sortBy === "date_desc") return b.effectiveDate.localeCompare(a.effectiveDate);
      if (sortBy === "date_asc") return a.effectiveDate.localeCompare(b.effectiveDate);
      return results.indexOf(a) - results.indexOf(b);
    });
  }, [results, sortBy, statusFilter]);

  return (
    <SitePageShell
      maxWidth="5xl"
      subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Търсене в документи и схеми</p>}
    >
      <div className="mb-10 text-center relative">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-white shadow-lg shadow-emerald-500/25 mb-4 animate-float">
          <Search size={30} />
        </div>
        <h1 className="font-extrabold text-3xl sm:text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600 mb-3">
          Намери документ и продължи с AI обслужване
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Търсенето обединява вътрешната ни правна база, индексираните наредби на ДФЗ/МЗ и RAG контекст. Всеки резултат предлага <span className="font-semibold text-slate-900 dark:text-white">директно теглене, източник и мигновен AI анализ</span>.
        </p>
      </div>

      {searchError && (
        <div className="mb-6 rounded-2xl border border-red-300/80 bg-red-50/90 px-5 py-4 text-sm font-medium text-red-900 shadow-md backdrop-blur-md dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-100">
          {searchError}
        </div>
      )}

      <div className="glass-panel-pro mb-8 rounded-[28px] p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.2),0_10px_30px_-10px_rgba(217,70,239,0.15)] border border-slate-200/90 dark:border-slate-700/80 transition-all">
        <form onSubmit={(event) => { event.preventDefault(); void handleSearch(); }}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Например: биологично производство, директни плащания 2025, БИСС..."
                className="w-full rounded-2xl border border-slate-200/80 bg-white/90 py-3.5 pl-12 pr-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-emerald-400 transition-all"
              />
            </div>
            <button type="submit" className="bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 hover:opacity-95 rounded-2xl px-8 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Търси в базата
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`rounded-md border px-3 py-1.5 text-xs transition ${
                  category === item.id
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {!hasSearched && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/90">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Популярни търсения</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  void handleSearch(suggestion);
                }}
                className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">Търся в документите...</div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/90">
          <p className="mb-2 text-slate-700 dark:text-slate-200">Няма намерени документи за “{query}”.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI може да те насочи как да формулираш търсенето или кои институции да провериш.</p>
          <Link href={askAiHref(query)} className="brand-cta-bg mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white">
            Питай AI <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/95">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Контрол</p>
            <div className="space-y-3">
              <label className="block text-xs text-slate-500">
                Статус
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                  <option value="all">Всички ({results.length})</option>
                  <option value="active">Актуални</option>
                  <option value="cancelled">Отменени</option>
                </select>
              </label>
              <label className="block text-xs text-slate-500">
                Сортиране
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                  <option value="relevance">По релевантност</option>
                  <option value="date_desc">Най-нови първо</option>
                  <option value="date_asc">Най-стари първо</option>
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Източник: {engineLabel(engine)}
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Намерени {visibleResults.length} резултата</p>
              <Link href={askAiHref(`Обобщи резултатите за: ${query}`)} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                Обслужи запитването с AI <MessageCircle size={15} />
              </Link>
            </div>

            {aiSummary && (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  <Sparkles size={14} /> Кратък AI отговор
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-200">{aiSummary}</p>
              </div>
            )}

            <div className="space-y-3">
              {visibleResults.map((doc) => {
                const isOpen = openDetailId === doc.id;
                const docQuestion = buildDocQuestion(query, doc);

                return (
                  <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/95">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">{doc.category}</span>
                      <span className="text-xs text-slate-500">{TYPE_LABELS[doc.type]}</span>
                      <span className="text-xs text-slate-500">{doc.effectiveDate}</span>
                      {isPublicDocumentId(doc.id) && <span className="text-xs text-slate-500">Публичен документ</span>}
                    </div>
                    <h2 className="mb-2 text-base font-semibold text-slate-950 dark:text-slate-100">{doc.title}</h2>
                    <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {doc.content}
                    </p>

                    {isOpen && (
                      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">{doc.content}</pre>
                        <p className="mt-3 text-xs text-slate-500">Източник: {doc.source}</p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenDetailId((current) => current === doc.id ? null : doc.id)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {isOpen ? "Скрий детайла" : "Виж детайла"}
                      </button>
                      <button type="button" onClick={() => handleAiLink(doc.id, docQuestion)} className="brand-cta-bg inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                        Връзка с AI <ArrowRight size={12} />
                      </button>
                      <a href={`/api/documents/${encodeURIComponent(doc.id)}/download`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        Изтегли <Download size={12} />
                      </a>
                      {!isPublicDocumentId(doc.id) && (
                        <Link href={`/doc/${doc.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                          Отвори документ
                        </Link>
                      )}
                      <a href={getKnowledgeSourceUrl(doc)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                        Оригинал <ExternalLink size={12} />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
