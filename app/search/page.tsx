"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import type { KnowledgeDoc } from "@/lib/knowledge/dfz-knowledge";
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
  "Срокове за заявления 2025",
  "Биологично производство",
  "Млади фермери",
  "Екосхема за разнообразяване",
  "Подаване през ИСАК"
];

const CULTURE_FILTERS = [
  { id: "all", label: "Всички култури" },
  { id: "zarneno-jitni", label: "Зърнено-житни" },
  { id: "bobovi", label: "Бобови" },
  { id: "maslodaini", label: "Маслодайни" },
  { id: "zelenchuci", label: "Зеленчуци" },
  { id: "ovoshtni", label: "Овощни" },
];

const REGION_FILTERS = [
  { id: "all", label: "Всички региони" },
  { id: "severoiztok", label: "Североизток" },
  { id: "severozapad", label: "Северозапад" },
  { id: "yugoiztok", label: "Югоизток" },
  { id: "yugozapad", label: "Югозапад" },
];

const ISSUER_FILTERS = [
  { id: "all", label: "Всички издатели" },
  { id: "dfz", label: "ДФЗ" },
  { id: "mzh", label: "МЗХ" },
  { id: "eurlex", label: "EUR-Lex" },
  { id: "babh", label: "БАБХ" },
];

const DOC_TYPE_FILTERS = [
  { id: "all", label: "Всички" },
  { id: "scheme", label: "Схема" },
  { id: "regulation", label: "Нормативен акт" },
  { id: "procedure", label: "Процедура" },
  { id: "deadline", label: "Срок" },
  { id: "video", label: "Видео" },
  { id: "pdf", label: "PDF / материал" },
  { id: "lesson", label: "Урок" },
] as const;

const DOC_STATUS_FILTERS = [
  { id: "all", label: "Всички" },
  { id: "active", label: "Актуален" },
  { id: "cancelled", label: "Отменен" },
] as const;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [engineHint, setEngineHint] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [cultureFilter, setCultureFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [issuerFilter, setIssuerFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"relevance" | "date_desc" | "date_asc">("relevance");
  /** Един разгънат резултат; без нативни <details> — браузърът често запазва „open“ между прерисовки. */
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const inferCulture = (doc: KnowledgeDoc) => {
    const text = `${doc.title} ${doc.content} ${doc.keywords.join(" ")}`.toLowerCase();
    if (/пшениц|ечемик|царевиц|ръж|овес/.test(text)) return "zarneno-jitni";
    if (/грах|нахут|леща|фасул|бобов/.test(text)) return "bobovi";
    if (/слънчоглед|рапица|маслод/.test(text)) return "maslodaini";
    if (/зеленчук|домати|пипер|краставиц/.test(text)) return "zelenchuci";
    if (/овощ|лозя|лозе|трайни насаждения|плод/.test(text)) return "ovoshtni";
    return "all";
  };

  const inferRegion = (doc: KnowledgeDoc) => {
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    if (/добрич|варна|шумен/.test(text)) return "severoiztok";
    if (/видин|враца|плевен|монтана/.test(text)) return "severozapad";
    if (/бургас|сливен|ямбол/.test(text)) return "yugoiztok";
    if (/софия|благоевград|перник|кюстендил/.test(text)) return "yugozapad";
    return "all";
  };

  const inferIssuer = (doc: KnowledgeDoc) => {
    const src = doc.source.toLowerCase();
    if (src.includes("дфз")) return "dfz";
    if (src.includes("мзх")) return "mzh";
    if (src.includes("eur") || src.includes("lex") || src.includes("регламент (ес)")) return "eurlex";
    if (src.includes("бабх")) return "babh";
    return "all";
  };

  const resultYears = useMemo(
    () =>
      Array.from(new Set(results.map((r) => r.effectiveDate.slice(0, 4))))
        .filter((x) => /^\d{4}$/.test(x))
        .sort((a, b) => b.localeCompare(a)),
    [results]
  );

  const filteredResults = useMemo(() => {
    const prepared = results.map((doc, index) => ({
      doc,
      index,
      culture: inferCulture(doc),
      region: inferRegion(doc),
      issuer: inferIssuer(doc),
      status: getDocumentStatus(doc),
    }));

    const filtered = prepared
      .filter((x) => (cultureFilter === "all" ? true : x.culture === cultureFilter))
      .filter((x) => (regionFilter === "all" ? true : x.region === regionFilter))
      .filter((x) => (issuerFilter === "all" ? true : x.issuer === issuerFilter))
      .filter((x) => (yearFilter === "all" ? true : x.doc.effectiveDate.startsWith(yearFilter)))
      .filter((x) => (typeFilter === "all" ? true : x.doc.type === typeFilter))
      .filter((x) => (statusFilter === "all" ? true : x.status === statusFilter));

    filtered.sort((a, b) => {
      if (sortBy === "date_desc") return b.doc.effectiveDate.localeCompare(a.doc.effectiveDate);
      if (sortBy === "date_asc") return a.doc.effectiveDate.localeCompare(b.doc.effectiveDate);
      // Relevance keeps API ranking order stable.
      return a.index - b.index;
    });

    return filtered.map((x) => x.doc);
  }, [results, cultureFilter, regionFilter, issuerFilter, yearFilter, typeFilter, statusFilter, sortBy]);

  const countBy = useMemo(() => {
    const counts = {
      culture: new Map<string, number>(),
      region: new Map<string, number>(),
      issuer: new Map<string, number>(),
      year: new Map<string, number>(),
      type: new Map<string, number>(),
      status: new Map<string, number>(),
    };

    const inc = (map: Map<string, number>, key: string) => {
      map.set(key, (map.get(key) ?? 0) + 1);
    };

    for (const doc of results) {
      inc(counts.culture, inferCulture(doc));
      inc(counts.region, inferRegion(doc));
      inc(counts.issuer, inferIssuer(doc));
      inc(counts.year, doc.effectiveDate.slice(0, 4));
      inc(counts.type, doc.type);
      inc(counts.status, getDocumentStatus(doc));
    }
    return counts;
  }, [results]);

  const activeFilterCount =
    (cultureFilter !== "all" ? 1 : 0) +
    (regionFilter !== "all" ? 1 : 0) +
    (issuerFilter !== "all" ? 1 : 0) +
    (yearFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setCultureFilter("all");
    setRegionFilter("all");
    setIssuerFilter("all");
    setYearFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setSortBy("relevance");
  };

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
        engine?: "internal-ai" | "meili+internal" | "typesense+internal";
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
          "DFZ база: бързо ранжиране по субсидии, наредби и срокове (вградено, без Typesense/Meilisearch)."
        );
      } else if (data.engine === "meili+internal") {
        setEngineHint(
          "Meilisearch + DFZ база — обединено ранжиране за по-точни хитове."
        );
      } else if (data.engine === "typesense+internal") {
        setEngineHint(
          "Typesense (видеа, PDF, уроци) + DFZ база — обединено ранжиране."
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
    <SitePageShell
      maxWidth="4xl"
      subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Търсене в документи и схеми</p>}
    >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-slate-950 dark:text-white">Намери това, което търсиш</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Субсидии, наредби, срокове, процедури - всичко на едно място.
          </p>
        </div>

        {searchError && (
          <div className="mb-4 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-900 dark:text-red-100">
            {searchError}
          </div>
        )}

        {engineHint && !searchError && (
          <div className="mb-4 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/50 px-4 py-3 text-sm text-indigo-950 dark:text-indigo-100">
            {engineHint}
          </div>
        )}

        <div className="brand-soft-surface rounded-2xl shadow-soft p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Например: 'биологично производство' или 'срокове 2025'"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-slate-400 dark:focus:border-teal-500/50 bg-white dark:bg-slate-950/80 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="brand-cta-bg px-6 py-3 text-white rounded-lg text-sm font-medium transition shadow-sm hover:brightness-105"
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
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {!hasSearched && (
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Популярни търсения</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm rounded-md transition text-slate-700 dark:text-slate-200"
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
          <div className="text-center py-12 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              Нищо не намерихме за &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Опитай с други ключови думи или питай Елена директно в чата.
            </p>
            <Link 
              href="/"
              className="brand-cta-bg inline-block mt-4 px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm hover:brightness-105 transition"
            >
              Питай Елена →
            </Link>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/95">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Филтри</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Нулирай
                </button>
              </div>
              {activeFilterCount > 0 ? (
                <p className="mb-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                  Активни филтри: {activeFilterCount}
                </p>
              ) : null}
              <div className="space-y-3">
                <label className="block text-xs">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Култура</span>
                  <select value={cultureFilter} onChange={(e) => setCultureFilter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                    {CULTURE_FILTERS.map((x) => (
                      (() => {
                        const count = x.id === "all" ? results.length : (countBy.culture.get(x.id) ?? 0);
                        return (
                      <option key={x.id} value={x.id}>
                        {`${x.label} (${count})`}
                      </option>
                        );
                      })()
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Регион</span>
                  <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                    {REGION_FILTERS.map((x) => (
                      (() => {
                        const count = x.id === "all" ? results.length : (countBy.region.get(x.id) ?? 0);
                        return (
                          <option key={x.id} value={x.id} disabled={x.id !== "all" && count === 0}>
                            {`${x.label} (${count})`}
                          </option>
                        );
                      })()
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Година</span>
                  <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                    <option value="all">Всички години ({results.length})</option>
                    {resultYears.map((year) => (
                      (() => {
                        const count = countBy.year.get(year) ?? 0;
                        return (
                          <option key={year} value={year} disabled={count === 0}>
                            {year} ({count})
                          </option>
                        );
                      })()
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Издател</span>
                  <select value={issuerFilter} onChange={(e) => setIssuerFilter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                    {ISSUER_FILTERS.map((x) => (
                      (() => {
                        const count = x.id === "all" ? results.length : (countBy.issuer.get(x.id) ?? 0);
                        return (
                          <option key={x.id} value={x.id} disabled={x.id !== "all" && count === 0}>
                            {`${x.label} (${count})`}
                          </option>
                        );
                      })()
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Тип документ</span>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                    {DOC_TYPE_FILTERS.map((x) => (
                      (() => {
                        const count = x.id === "all" ? results.length : (countBy.type.get(x.id) ?? 0);
                        return (
                          <option key={x.id} value={x.id} disabled={x.id !== "all" && count === 0}>
                            {`${x.label} (${count})`}
                          </option>
                        );
                      })()
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Статус</span>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                    {DOC_STATUS_FILTERS.map((x) => (
                      (() => {
                        const count = x.id === "all" ? results.length : (countBy.status.get(x.id) ?? 0);
                        return (
                          <option key={x.id} value={x.id} disabled={x.id !== "all" && count === 0}>
                            {`${x.label} (${count})`}
                          </option>
                        );
                      })()
                    ))}
                  </select>
                </label>
              </div>
            </aside>

            <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Намерени {filteredResults.length} резултата</p>
              <label className="text-xs text-slate-500 dark:text-slate-400">
                Сортиране:{" "}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "relevance" | "date_desc" | "date_asc")} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                  <option value="relevance">По релевантност</option>
                  <option value="date_desc">Най-нови първо</option>
                  <option value="date_asc">Най-стари първо</option>
                </select>
              </label>
            </div>
            {aiSummary && (
              <div className="mb-5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/90 dark:bg-sky-950/50 px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-sky-800 dark:text-sky-300 mb-2 font-semibold">
                  Кратък отговор (вътрешно AI, без външен модел)
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">{aiSummary}</p>
              </div>
            )}
            {!aiSummary && filteredResults.length > 0 ? (
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Няма AI обобщение за тази заявка — използвай „Отвори документа“ за детайли.
              </p>
            ) : null}
            {filteredResults.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                Няма съвпадения за избраните филтри. Пробвай с „Нулирай“.
              </div>
            ) : null}
            <div className="space-y-3">
              {filteredResults.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-slate-900/95 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
                          {doc.category}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {doc.type === "scheme" && "Схема"}
                          {doc.type === "regulation" && "Регулация"}
                          {doc.type === "procedure" && "Процедура"}
                          {doc.type === "deadline" && "Срокове"}
                          {doc.type === "video" && "Видео"}
                          {doc.type === "pdf" && "PDF"}
                          {doc.type === "lesson" && "Урок"}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">{doc.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-line">
                        {doc.content.substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      aria-expanded={openDetailId === doc.id}
                      className="text-sm text-left w-full text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 underline decoration-indigo-400/50 dark:decoration-indigo-500/40 underline-offset-2"
                      onClick={() =>
                        setOpenDetailId((prev) => (prev === doc.id ? null : doc.id))
                      }
                    >
                      {openDetailId === doc.id ? "Скрий пълната информация" : "Виж пълната информация"}
                    </button>
                    {openDetailId === doc.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {doc.content}
                        </pre>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                          Източник: {doc.source}
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          {!isPublicDocumentId(doc.id) ? (
                            <Link href={`/doc/${doc.id}`} className="brand-link inline-flex items-center gap-1 text-xs">
                              Отвори документа
                            </Link>
                          ) : null}
                          <a
                            href={getKnowledgeSourceUrl(doc)}
                            target="_blank"
                            rel="noreferrer"
                            className="brand-link inline-flex items-center gap-1 text-xs"
                          >
                            {isPublicDocumentId(doc.id) ? "PDF / оригинал" : "Отвори оригинала"}{" "}
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}
    </SitePageShell>
  );
}
