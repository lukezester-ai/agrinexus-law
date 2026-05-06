"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Calculator, Check, ExternalLink, FileDown, FileText, Leaf, Scale, ShieldCheck, Sparkles, Sprout } from "lucide-react";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";

type SearchResponse = {
  results?: KnowledgeDoc[];
  engine?: "meili+internal" | "internal-ai";
  aiSummary?: string;
  error?: string;
};

const CATEGORY_CARDS = [
  { title: "Субсидии", subtitle: "директни плащания и интервенции", icon: Sprout },
  { title: "Закони", subtitle: "нормативни актове и изисквания", icon: Scale },
  { title: "Сертификати", subtitle: "изисквания и документи", icon: ShieldCheck },
  { title: "Био производство", subtitle: "регламенти и контрол", icon: Leaf },
  { title: "Растителна защита", subtitle: "препарати и правила", icon: ShieldCheck },
  { title: "ЕС регламенти", subtitle: "EUR-Lex и CAP рамка", icon: FileText },
  { title: "Образци", subtitle: "форми и заявления", icon: FileDown },
  { title: "Калкулатори", subtitle: "площи, субсидии, добиви", icon: Calculator },
];

const UPDATES = [
  { badge: "НОВО", title: "Наредба 3 за директните плащания — изменение", meta: "МЗХ · преди 2 часа" },
  { badge: "ЪПДЕЙТ", title: "Регламент (ЕС) за био производство — актуализация", meta: "EUR-Lex · вчера" },
  { badge: "СРОК", title: "Заявления за директни плащания — краен срок", meta: "ДФЗ · остават 40 дни" },
];

export default function Home() {
  const resultsSectionRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [engine, setEngine] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | KnowledgeDoc["type"]>("all");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistOk, setWaitlistOk] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const filteredResults = useMemo(
    () => results.filter((doc) => (filterType === "all" ? true : doc.type === filterType)),
    [results, filterType],
  );

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setLoading(true);
    setError(null);
    setAiSummary("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), category: "all" }),
      });
      const data = (await res.json().catch(() => ({}))) as SearchResponse;
      if (!res.ok) {
        setError(data.error || "Грешка при търсене.");
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
      setAiSummary(data.aiSummary ?? "");
      setEngine(data.engine ?? "");
    } catch {
      setError("Мрежова грешка. Опитай отново.");
    } finally {
      setLoading(false);
    }
  };

  const onWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistError(null);
    setWaitlistOk(false);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setWaitlistError(data.error || "Неуспешна регистрация.");
        return;
      }
      setWaitlistOk(true);
      setWaitlistEmail("");
    } catch {
      setWaitlistError("Мрежова грешка. Опитай пак.");
    }
  };

  return (
    <div className="min-h-screen agri-page-bg text-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="brand-soft-surface mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3 shadow-sm dark:border-indigo-900/40 dark:bg-stone-900/90">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Leaf size={18} />
            </span>
            <span>AgriNexus-Law</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 dark:text-stone-300">
            <Link href="/search" className="hover:text-stone-900 dark:hover:text-white">Документи</Link>
            <Link href="/srokove" className="hover:text-stone-900 dark:hover:text-white">Срокове</Link>
            <Link href="/kalkulator" className="hover:text-stone-900 dark:hover:text-white">Калкулатори</Link>
            <Link href="/vhod" className="brand-link font-medium">Вход</Link>
          </div>
        </nav>

        <section className="brand-soft-surface mb-8 rounded-2xl border px-4 py-10 text-center shadow-sm dark:border-indigo-900/40 dark:bg-stone-900/90 sm:px-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Цялата документация за земеделието на едно място</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-600 dark:text-stone-300 sm:text-base">
            Закони, наредби, сертификати и формуляри — с AI търсене на естествен език.
          </p>
          <form onSubmit={onSearch} className="mx-auto mt-6 max-w-3xl">
            <div className="brand-soft-input flex items-center gap-2 rounded-2xl border p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <Sparkles className="text-violet-600" size={20} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Попитай: "Какви документи трябват за био сертификат на пшеница?"'
                className="w-full bg-transparent text-sm outline-none sm:text-base"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="brand-cta-bg rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Търся..." : "Търси"}
              </button>
            </div>
          </form>
          {engine ? <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Search engine: <strong>{engine}</strong></p> : null}
        </section>

        <section ref={resultsSectionRef} className="brand-soft-surface mb-10 rounded-2xl border p-5 shadow-sm dark:border-indigo-900/40 dark:bg-stone-900/90">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Резултати от AI търсене</h2>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | KnowledgeDoc["type"])} className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-900">
              <option value="all">Всички типове</option>
              <option value="scheme">Схеми</option>
              <option value="regulation">Нормативни актове</option>
              <option value="procedure">Процедури</option>
              <option value="deadline">Срокове</option>
            </select>
          </div>
          {aiSummary ? (
            <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="font-medium text-violet-900 dark:text-violet-200">AI обобщение</p>
              <p className="mt-1 text-violet-800 dark:text-violet-300">{aiSummary}</p>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!error && filteredResults.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">Няма резултати. Използвай търсачката по-горе за да получиш документи и резюме.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredResults.map((doc) => (
                <article key={doc.id} className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
                  <p className="mb-1 text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">{doc.category} · {doc.type}</p>
                  <h3 className="text-sm font-semibold">{doc.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-300">{doc.content}</p>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Източник: {doc.source} · {doc.effectiveDate}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => setQuery(`Обясни накратко: ${doc.title}`)} className="rounded-md border border-stone-300 px-2 py-1 text-xs dark:border-stone-700">Попитай AI</button>
                    <Link href={`/doc/${doc.id}`} className="rounded-md border border-stone-300 px-2 py-1 text-xs dark:border-stone-700">
                      Отвори
                    </Link>
                    <a
                      href={getKnowledgeSourceUrl(doc)}
                      target="_blank"
                      rel="noreferrer"
                      className="brand-link inline-flex items-center gap-1 text-xs"
                    >
                      Оригинал <ExternalLink size={12} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Категории</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button key={card.title} type="button" onClick={() => setQuery(card.title)} className="brand-soft-surface rounded-xl border p-4 text-left shadow-sm transition hover:border-indigo-400 dark:border-indigo-900/40 dark:bg-stone-900/90">
                  <Icon size={20} className="mb-2 text-indigo-700 dark:text-indigo-300" />
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{card.subtitle}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Bell size={16} className="text-stone-500" />Последни промени и срокове</h2>
            <Link href="/srokove" className="brand-link text-xs font-medium">Виж всички</Link>
          </div>
          <div className="space-y-3">
            {UPDATES.map((item) => (
              <div key={item.title} className="flex items-start gap-3 border-b border-stone-100 pb-3 last:border-0 last:pb-0 dark:border-stone-800">
                <span className="mt-0.5 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">{item.badge}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-2xl bg-indigo-700 px-5 py-7 text-white sm:px-8">
          <h2 className="text-xl font-semibold">Абонамент за известия</h2>
          <p className="mt-2 text-sm text-indigo-100">Получавай известия при промени по документи, срокове и регламенти.</p>
          {waitlistError ? <p className="mt-3 text-sm text-amber-100">{waitlistError}</p> : null}
          {waitlistOk ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm"><Check size={16} /> Успешно записване!</p>
          ) : (
            <form onSubmit={onWaitlist} className="mt-4 flex max-w-lg flex-col gap-2 sm:flex-row">
              <input type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="Твоят имейл" className="flex-1 rounded-lg px-3 py-2 text-sm text-stone-900 outline-none" />
              <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-800">Абонирай ме</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
