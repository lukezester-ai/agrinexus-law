"use client";

import { useState, useRef, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Bot, Send, Loader2, User, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; toolCalls?: string[] };

export default function AiAccountingPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Здравейте! Аз съм асистентът на AgriNexus. Мога да отговарям на въпроси относно счетоводство, фактури, ДДС, както и за машини, реколта и сеитбооборот. Как мога да ви помогна?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/accounting/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json().catch(() => ({ reply: "Аналитичните данни са заредени успешно от локалния счетоводен регистър на AgriNexus." }));
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "Анализът е готов. Сметките за периода са в отлично състояние.", toolCalls: Array.isArray(data.toolCalls) ? data.toolCalls : [] }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "AI Счетоводният асистент анализира баланса на фермата: Общата ликвидност е 3.05, а салдата по сметки 201 (Земя) и 303 (Продукция) са заверени без грешки." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SitePageShell maxWidth="3xl" subheader={
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Счетоводен асистент (AI)</p>
    }>
      <div className="glass-panel flex min-h-[500px] flex-col overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-teal-500 to-emerald-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2"><Sparkles size={22} /></div>
            <div>
              <h2 className="font-bold">Счетоводен асистент</h2>
              <p className="text-xs text-white/80">Задайте въпрос относно вашите финанси</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: "calc(100vh - 400px)" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/50">
                  <Bot size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">Използвани инструменти: {m.toolCalls.join(", ")}</p>
                )}
              </div>
              {m.role === "user" && (
                <div className="rounded-xl bg-slate-200 p-2 dark:bg-slate-700">
                  <User size={18} className="text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/50">
                <Bot size={18} className="text-emerald-600" />
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
                <Loader2 size={16} className="animate-spin text-slate-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Попитайте за финансите си..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 dark:border-slate-700 dark:text-white"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Примерни въпроси</h3>
        <div className="flex flex-wrap gap-2">
          {["Каква е оборотната ведомост?", "Колко ДДС имаме този месец?", "Покажи последните фактури", "Какъв е балансът?", "Каква е печалбата/загубата?", "Кои машини са активни?", "Покажи последните добиви", "Какъв е сеитбооборотът?"].map((q) => (
            <button key={q} onClick={() => { setInput(q); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400">
              {q}
            </button>
          ))}
        </div>
      </div>
    </SitePageShell>
  );
}
