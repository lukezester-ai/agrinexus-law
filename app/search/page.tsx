"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import type { KnowledgeDoc } from "@/lib/knowledge/dfz-knowledge";

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
  "Срокове за заявления 2025",
  "Биологично производство",
  "Млади фермери",
  "Екосхема за разнообразяване",
  "Подаване през ИСАК"
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [engineHint, setEngineHint] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  /** Един разгънат резултат; без нативни <details> — браузърът често запазва „open“ между прерисовки. */
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    searchAbortRef.current?.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;

    setLoading(true);
    setOpenDetailId(null);
    setHasSearched(true);
    setSearchError(null);
    setEngineHint(null);
    setAiSummary(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, category }),
        signal: ac.signal,
      });
      const raw = await res.text();
      let data: {
        results?: KnowledgeDoc[];
        error?: string;
        engine?: "internal-ai" | "meili+internal";
        aiSummary?: string | null;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setSearchError(raw?.slice(0, 300) || "Невалиден отговор от сървъра.");
        setResults([]);
        return;
      }
      if (!res.ok) {
        setSearchError(data.error || "Грешка при търсене.");
        setResults([]);
        return;
      }
      if (data.engine === "internal-ai") {
        setEngineHint(
          "DFZ база: бързо ранжиране по субсидии, наредби и срокове (вградено, без Meilisearch)."
        );
      } else if (data.engine === "meili+internal") {
        setEngineHint(
          "Meilisearch + DFZ база — обединено ранжиране за по-точни хитове."
        );
      }
      setAiSummary(typeof data.aiSummary === "string" && data.aiSummary.trim() ? data.aiSummary : null);
      setResults(data.results || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Search error:", err);
      setSearchError("Мрежова грешка. Опитай отново.");
      setResults([]);
    } finally {
      if (searchAbortRef.current === ac) {
        setLoading(false);
      }
    }
  }, [query, category]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const id = window.setTimeout(() => void handleSearch(q), 300);
    return () => window.clearTimeout(id);
  }, [query, category, handleSearch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (q && q.length >= 2) {
      setQuery(q);
    }
  }, []);

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
            <ArrowLeft size={16} />
            <span className="text-sm">Към началото</span>
          </Link>
          <div className="font-medium text-base dark:text-stone-100">Търсачка</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-2xl font-medium mb-2 dark:text-stone-50">Намери това, което търсиш</h1>
          <p className="text-stone-600 dark:text-stone-400">
            Субсидии, наредби, срокове, процедури - всичко на едно място.
          </p>
        </div>

        {searchError && (
          <div className="mb-4 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-900 dark:text-red-100">
            {searchError}
          </div>
        )}

        {engineHint && !searchError && (
          <div className="mb-4 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50/90 dark:bg-teal-950/50 px-4 py-3 text-sm text-teal-950 dark:text-teal-100">
            {engineHint}
          </div>
        )}

        <div className="bg-white dark:bg-stone-900/95 rounded-2xl border border-teal-100/70 dark:border-teal-900/40 shadow-soft p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Например: 'биологично производство' или 'срокове 2025'"
                  className="w-full pl-11 pr-4 py-3 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:border-stone-400 dark:focus:border-teal-500/50 bg-white dark:bg-stone-950/80 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 text-white rounded-lg text-sm font-medium transition"
                style={{ background: "#0d9488" }}
              >
                Търси
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition ${
                    category === cat.id
                      ? "border-[#0d9488] bg-[#0d9488] text-white"
                      : "border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-[#57534e] dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {!hasSearched && (
          <div className="bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Популярни търсения</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="px-3 py-2 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-sm rounded-md transition text-stone-700 dark:text-stone-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "0.1s" }}></span>
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
            </div>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200 dark:border-stone-700">
            <p className="text-stone-600 dark:text-stone-300 mb-2">
              Нищо не намерихме за &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Опитай с други ключови думи или питай Елена директно в чата.
            </p>
            <Link 
              href="/"
              className="inline-block mt-4 px-4 py-2 text-white rounded-lg text-sm"
              style={{ background: "#0d9488" }}
            >
              Питай Елена →
            </Link>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">Намерени {results.length} резултата</p>
            {aiSummary && (
              <div className="mb-5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/90 dark:bg-sky-950/50 px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-sky-800 dark:text-sky-300 mb-2 font-semibold">
                  Кратък отговор (вътрешно AI, без външен модел)
                </p>
                <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">{aiSummary}</p>
              </div>
            )}
            <div className="space-y-3">
              {results.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-stone-900/95 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-sky-950 dark:text-sky-200">
                          {doc.category}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {doc.type === "scheme" && "Схема"}
                          {doc.type === "regulation" && "Регулация"}
                          {doc.type === "procedure" && "Процедура"}
                          {doc.type === "deadline" && "Срокове"}
                        </span>
                      </div>
                      <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">{doc.title}</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 whitespace-pre-line">
                        {doc.content.substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      aria-expanded={openDetailId === doc.id}
                      className="text-sm text-left w-full text-[#0d9488] dark:text-teal-400 hover:text-stone-700 dark:hover:text-teal-300 underline decoration-[#0d9488]/40 dark:decoration-teal-500/40 underline-offset-2"
                      onClick={() =>
                        setOpenDetailId((prev) => (prev === doc.id ? null : doc.id))
                      }
                    >
                      {openDetailId === doc.id ? "Скрий пълната информация" : "Виж пълната информация"}
                    </button>
                    {openDetailId === doc.id && (
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700">
                        <pre className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {doc.content}
                        </pre>
                        <p className="text-xs text-stone-500 dark:text-stone-500 mt-3">
                          Източник: {doc.source}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
