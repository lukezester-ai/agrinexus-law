"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Calculator, Check, ExternalLink, FileDown, FileText, Leaf, Scale, ShieldCheck, Sparkles, Sprout, ThumbsDown, ThumbsUp } from "lucide-react";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";

type SearchResponse = {
  results?: KnowledgeDoc[];
  engine?: "meili+internal" | "internal-ai";
  aiSummary?: string;
  error?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  chatLogId?: string | null;
};

type FeedbackState = {
  vote: 1 | -1;
  status: "saving" | "saved" | "error";
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
  const searchFormRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [engine, setEngine] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | KnowledgeDoc["type"]>("all");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistEmailConfirmed, setWaitlistEmailConfirmed] = useState("");
  const [waitlistOk, setWaitlistOk] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [chatCharacter, setChatCharacter] = useState<"elena" | "boris" | "viktoria">("elena");
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedbackByLogId, setFeedbackByLogId] = useState<Record<string, FeedbackState>>({});
  const [searchFocusPulse, setSearchFocusPulse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const chatQ = new URLSearchParams(window.location.search).get("chatQ");
    if (!chatQ) return;
    setChatInput((prev) => (prev.trim() ? prev : chatQ));
  }, []);

  const executeSearch = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setLoading(true);
    setError(null);
    setAiSummary("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, category: "all" }),
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

  const filteredResults = useMemo(
    () => results.filter((doc) => (filterType === "all" ? true : doc.type === filterType)),
    [results, filterType],
  );

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    await executeSearch(query);
  };

  const onWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistError(null);
    setWaitlistOk(false);
    setWaitlistEmailConfirmed("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: waitlistEmail.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setWaitlistError(data.error || "Неуспешна регистрация.");
        return;
      }
      setWaitlistOk(true);
      setWaitlistEmailConfirmed(waitlistEmail.trim());
      setWaitlistEmail("");
    } catch {
      setWaitlistError("Мрежова грешка. Опитай пак.");
    }
  };

  const jumpToSearch = (prefill?: string, autoRun = false) => {
    const next = (prefill ?? query).trim();
    if (prefill) setQuery(prefill);
    searchFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.setSelectionRange(
        searchInputRef.current.value.length,
        searchInputRef.current.value.length,
      );
      setSearchFocusPulse(true);
      window.setTimeout(() => setSearchFocusPulse(false), 900);
      if (autoRun && next) {
        void executeSearch(next);
      }
    }, 260);
  };

  const sendChat = async (e: FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatBusy(true);
    setChatError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: chatCharacter,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { response?: string; error?: string; chatLogId?: string | null };
      if (!res.ok || !data.response) {
        throw new Error(data.error || "Грешка при чат заявка.");
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response || "", chatLogId: data.chatLogId ?? null }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Грешка при чат заявка.";
      setChatError(msg);
    } finally {
      setChatBusy(false);
    }
  };

  const sendFeedback = async (chatLogId: string, feedback: 1 | -1) => {
    if (!chatLogId) return;
    setFeedbackByLogId((prev) => ({ ...prev, [chatLogId]: { vote: feedback, status: "saving" } }));
    try {
      const res = await fetch("/api/chat-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatLogId, feedback }),
      });
      if (!res.ok) throw new Error("feedback failed");
      setFeedbackByLogId((prev) => ({ ...prev, [chatLogId]: { vote: feedback, status: "saved" } }));
    } catch {
      setFeedbackByLogId((prev) => {
        const current = prev[chatLogId];
        return {
          ...prev,
          [chatLogId]: { vote: current?.vote ?? feedback, status: "error" },
        };
      });
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
            <Link href="/vhod" className="brand-link font-medium">„Моя ферма“ — имейл</Link>
          </div>
        </nav>

        <section className="brand-soft-surface mb-8 rounded-2xl border px-4 py-10 text-center shadow-sm dark:border-indigo-900/40 dark:bg-stone-900/90 sm:px-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Цялата документация за земеделието на едно място</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-600 dark:text-stone-300 sm:text-base">
            Закони, наредби, сертификати и формуляри — с AI търсене на естествен език.
          </p>
          <form onSubmit={onSearch} className="mx-auto mt-6 max-w-3xl">
            <div
              ref={searchFormRef}
              className={`brand-soft-input flex items-center gap-2 rounded-2xl border p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30 transition-all ${
                searchFocusPulse
                  ? "ring-2 ring-indigo-400 shadow-[0_0_0_6px_rgba(129,140,248,0.20)]"
                  : ""
              }`}
            >
              <Sparkles className="text-violet-600" size={20} />
              <input
                ref={searchInputRef}
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
                    <button
                      type="button"
                      onClick={() => jumpToSearch(`Обясни накратко: ${doc.title}`, true)}
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs dark:border-stone-700"
                    >
                      Попитай AI
                    </button>
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
                <button
                  key={card.title}
                  type="button"
                  onClick={() => jumpToSearch(card.title, true)}
                  className="brand-soft-surface rounded-xl border p-4 text-left shadow-sm transition hover:border-indigo-400 dark:border-indigo-900/40 dark:bg-stone-900/90"
                >
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
            <div className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm">
              <p className="inline-flex items-center gap-2 font-medium">
                <Check size={16} /> Успешно записване за {waitlistEmailConfirmed || "имейла ти"}.
              </p>
              <p className="mt-1 text-xs text-indigo-100">
                Ще получаваш известия при важни промени по документи, срокове и регламенти.
              </p>
            </div>
          ) : (
            <form onSubmit={onWaitlist} className="mt-4 flex max-w-lg flex-col gap-2 sm:flex-row">
              <input type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="Твоят имейл" className="flex-1 rounded-lg px-3 py-2 text-sm text-stone-900 outline-none" />
              <button
                type="submit"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-800 disabled:opacity-60"
              >
                Абонирай ме
              </button>
            </form>
          )}
        </section>

        <section id="chat" className="mb-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Чат с екипа</h2>
            <select
              value={chatCharacter}
              onChange={(e) => setChatCharacter(e.target.value as "elena" | "boris" | "viktoria")}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-900"
            >
              <option value="elena">Елена (право/ДФЗ)</option>
              <option value="boris">Борис (поле)</option>
              <option value="viktoria">Виктория (финанси)</option>
            </select>
          </div>

          <div className="mb-3 max-h-80 overflow-auto rounded-xl border border-stone-200 p-3 dark:border-stone-700">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400">Задай въпрос и използвай 👍/👎 под отговора, за да се самообучава системата.</p>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`rounded-lg p-2 text-sm ${msg.role === "user" ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-stone-50 dark:bg-stone-800/60"}`}>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">{msg.role === "user" ? "Ти" : "Асистент"}</p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && msg.chatLogId ? (
                      <div className="mt-2 flex items-center gap-2">
                        {(() => {
                          const state = feedbackByLogId[msg.chatLogId];
                          if (!state) return null;
                          if (state.status === "saving") {
                            return <span className="text-[11px] text-stone-500 dark:text-stone-400">Запазва се...</span>;
                          }
                          if (state.status === "saved") {
                            return <span className="text-[11px] text-emerald-700 dark:text-emerald-300">✅ Feedback е записан</span>;
                          }
                          return <span className="text-[11px] text-red-600 dark:text-red-300">⚠️ Неуспешен запис</span>;
                        })()}
                        <button
                          type="button"
                          onClick={() => void sendFeedback(msg.chatLogId as string, 1)}
                          disabled={feedbackByLogId[msg.chatLogId]?.status === "saving"}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-60 ${
                            feedbackByLogId[msg.chatLogId]?.vote === 1 ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-stone-300 dark:border-stone-600"
                          }`}
                        >
                          <ThumbsUp size={12} /> Полезно
                        </button>
                        <button
                          type="button"
                          onClick={() => void sendFeedback(msg.chatLogId as string, -1)}
                          disabled={feedbackByLogId[msg.chatLogId]?.status === "saving"}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-60 ${
                            feedbackByLogId[msg.chatLogId]?.vote === -1 ? "border-rose-500 text-rose-700 dark:text-rose-300" : "border-stone-300 dark:border-stone-600"
                          }`}
                        >
                          <ThumbsDown size={12} /> Неточно
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {chatError ? <p className="mb-2 text-xs text-red-600">{chatError}</p> : null}
          <form onSubmit={sendChat} className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Задай въпрос към избрания специалист..."
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
            />
            <button
              type="submit"
              disabled={chatBusy || !chatInput.trim()}
              className="brand-cta-bg rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {chatBusy ? "..." : "Изпрати"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
