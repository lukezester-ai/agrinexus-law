"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Send, Check, Sparkles, MessageCircle, Search, User, FolderOpen, Wheat, LogIn, Calculator, Scale } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  CHARACTERS,
  CHARACTER_ACCENT,
  DEFAULT_CHARACTER_ID,
  getAllCharacters,
  type CharacterId,
  type Character,
} from "@/lib/characters";
import {
  loadFarmProfile,
  type FarmProfileSnapshot,
  isFarmProfileSubstantial,
} from "@/lib/farm-profile";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [activeCharacter, setActiveCharacter] = useState<CharacterId>(DEFAULT_CHARACTER_ID);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; replySource?: "internal_kb" | "openai" }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<FarmProfileSnapshot | null>(null);
  const auth = useAuthUser();

  const currentCharacter = CHARACTERS[activeCharacter];
  const allCharacters = getAllCharacters();
  const profileReady = isFarmProfileSubstantial(userProfile);

  useEffect(() => {
    const snapshot = loadFarmProfile();
    if (snapshot) setUserProfile(snapshot);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setWaitlistError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const raw = await res.text();
      let data: { success?: boolean; message?: string; error?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        data = { error: raw?.slice(0, 200) || "Грешка." };
      }

      if (res.ok && data.success !== false) {
        setSubmitted(true);
        setEmail("");
      } else {
        setWaitlistError(data.error || data.message || "Неуспешна регистрация.");
      }
    } catch (err) {
      console.error("Грешка:", err);
      setWaitlistError("Мрежова грешка. Опитай по-късно.");
    }
  };

  const handleCharacterSwitch = (charId: CharacterId) => {
    setActiveCharacter(charId);
    setMessages([]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMessage = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, { role: "user", content: userMessage }],
          characterId: activeCharacter,
          userProfile: userProfile
        })
      });

      const raw = await res.text();
      let data: { response?: string; error?: string; replySource?: "internal_kb" | "openai" } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        data = { error: raw?.slice(0, 400) || "Невалиден отговор от сървъра." };
      }
      
      if (!res.ok) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.error || "Извинявай, нещо се обърка."
        }]);
      } else {
        const reply = data.response ?? data.error ?? "Празен отговор от AI.";
        const replySource = data.replySource === "internal_kb" ? "internal_kb" : "openai";
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: reply,
          replySource,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Извинявай, нещо се обърка. Опитай пак след малко."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const applyExamplePrompt = (example: string) => {
    setChatInput(example);
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 premium-nav backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base border"
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(13,148,136,0.22))",
                borderColor: "rgba(45,212,191,0.45)",
                color: "#5eead4",
              }}
              aria-hidden="true"
            >
              🌾
            </div>
            <div>
              <div className="font-semibold text-sm sm:text-base leading-none tracking-tight">
                <span className="text-white">Agri</span><span className="brand-nexus-gold">Nexus</span><span className="brand-law-suffix">.Law</span>
              </div>
              <div className="text-[11px] sm:text-xs text-teal-50/75 mt-1">Твоят земеделски екип</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 text-sm">
            <Link
              href="/kalkulator"
              className="text-teal-50/85 hover:text-teal-100 flex items-center gap-1 transition-colors font-medium"
              title="Ориентировъчни субсидии"
            >
              <Calculator size={14} aria-hidden />
              <span className="hidden sm:inline">Калкулатор</span>
            </Link>
            <Link
              href="/search"
              className="text-teal-50/85 hover:text-teal-100 flex items-center gap-1 sm:gap-1.5 transition-colors"
              title="Търсачка по субсидии и ДФЗ"
            >
              <Search size={14} aria-hidden />
              <span className="max-[380px]:sr-only">Търсачка</span>
            </Link>
            {auth.status === "signed_in" && (
              <Link
                href="/moya-ferma"
                className="text-teal-50/85 hover:text-teal-100 flex items-center gap-1 transition-colors font-medium"
                title="Моя ферма">
                <Wheat size={14} aria-hidden />
                <span className="hidden sm:inline">Моя ферма</span>
              </Link>
            )}
            {(auth.status === "anonymous" || auth.status === "unconfigured") && (
              <Link
                href="/vhod"
                className="text-teal-50/85 hover:text-teal-100 flex items-center gap-1 transition-colors"
                title="Вход за регистрирани потребители">
                <LogIn size={14} aria-hidden />
                <span className="hidden sm:inline">Вход</span>
              </Link>
            )}
            <Link
              href="/documents"
              className="text-teal-50/85 hover:text-teal-100 flex items-center gap-1 transition-colors"
              title="Мои документи">
              <FolderOpen size={14} aria-hidden />
              <span className="hidden lg:inline">Документи</span>
            </Link>
            <Link href="/profile" className="text-teal-50/85 hover:text-teal-100 flex items-center gap-1 transition-colors">
              <User size={14} /> 
              <span className="hidden md:inline">{profileReady ? "Моят профил" : "Профил"}</span>
            </Link>
            <a 
              href="#waitlist"
              className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition premium-cta"
            >
              Започни
            </a>
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-9 sm:py-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs mb-4 premium-pill">
          <Sparkles size={12} />
          <span>Цял екип за твоето стопанство · Signature Edition</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-4 tracking-tight">
          <span className="hero-main-title block">Запознай се с екипа на</span>
          <span className="block mt-1">
            <span className="text-[#0d9488] dark:text-teal-300">Agri</span>
            <span className="brand-nexus-gold">Nexus</span>
            <span className="brand-law-suffix">.Law</span>
          </span>
        </h1>
        <p className="text-lg text-stone-600 dark:text-stone-300 max-w-xl mx-auto mb-2 leading-relaxed">
          Не един бот за всичко - <strong>цял екип специалисти</strong>.
        </p>
        <p className="text-base text-stone-500 dark:text-stone-400 max-w-xl mx-auto mb-6 leading-relaxed">
          Всеки знае своята работа. Питай когото ти трябва.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2 flex-wrap">
          <Link
            href="/kalkulator"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg ring-2 ring-teal-400/55 ring-offset-2 ring-offset-transparent dark:ring-teal-300/40"
            style={{ background: "#0d9488" }}
          >
            <Calculator size={16} aria-hidden />
            Калкулатор на субсидии
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg bg-[#0d9488] ring-2 ring-teal-900/25 dark:bg-teal-600 dark:ring-teal-300/45 dark:shadow-teal-950/35"
          >
            <Search size={16} aria-hidden />
            Търси в базата знания (ДФЗ)
          </Link>
          {!profileReady && (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition border-2 border-teal-700/30 bg-teal-50 text-teal-950 hover:bg-teal-100 hover:border-teal-600/45 dark:border-teal-400/55 dark:bg-teal-950/35 dark:text-teal-50 dark:backdrop-blur-sm dark:shadow-teal-950/25 dark:hover:bg-teal-900/45 dark:hover:border-teal-300/70"
            >
              Попълни профил за по-точни данни
            </Link>
          )}
        </div>
      </section>

      <section id="team" className="max-w-5xl mx-auto px-4 sm:px-6 mb-10 sm:mb-12">
        <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 text-center mb-4">
          С кого искаш да говориш?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allCharacters.map((char) => (
            <CharacterCard 
              key={char.id} 
              character={char}
              isActive={activeCharacter === char.id}
              onSelect={() => handleCharacterSwitch(char.id)}
            />
          ))}
        </div>
      </section>

      <section id="chat" className="max-w-3xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="bg-white dark:bg-stone-900/95 rounded-2xl shadow-soft border border-teal-100/70 dark:border-teal-900/35 overflow-hidden luxury-glow flex flex-col max-h-[min(82vh,800px)]">
          <div className="p-4 border-b flex items-center gap-3 shrink-0"
            style={{ background: currentCharacter.bgColor, borderColor: "rgba(0,0,0,0.06)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${currentCharacter.primaryColorHex}, ${currentCharacter.textColor})` }}>
              {currentCharacter.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: currentCharacter.textColor }}>
                {currentCharacter.fullName}
              </div>
              <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: currentCharacter.textColor }}>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                онлайн · {currentCharacter.role}
              </div>
            </div>
            {profileReady && (
              <div className="text-xs px-2 py-1 rounded-md bg-white/50 dark:bg-black/10 shrink-0" style={{ color: currentCharacter.textColor }}>
                Знам твоя профил
              </div>
            )}
          </div>

          {/* Персони + бързи подкани остават видими — не се „губят“ под отговорите */}
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 dark:border-stone-700/90 bg-stone-50/90 dark:bg-stone-950/50">
            <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              С кого чатиш сега
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {allCharacters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleCharacterSwitch(char.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeCharacter === char.id
                      ? "border-teal-500 bg-teal-500/15 text-teal-900 dark:text-teal-100 dark:border-teal-400/70 dark:bg-teal-500/20"
                      : "border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-teal-400/50 hover:bg-teal-500/5"
                  }`}
                >
                  {char.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Бързи подкани</span>
              <button
                type="button"
                onClick={clearChat}
                className="text-xs text-teal-700 dark:text-teal-300/90 hover:underline disabled:opacity-40"
                disabled={messages.length === 0 && !loading}>
                Изчисти чата
              </button>
            </div>
            <p className="text-[11px] leading-snug text-stone-500 dark:text-stone-400 mb-2">
              Още подкани — превърти списъка
            </p>
            <div
              className="max-h-[132px] max-[640px]:max-h-[min(42vh,280px)] overflow-y-auto pr-1 space-y-2 [scrollbar-gutter:stable]"
              role="region"
              aria-label="Бързи подкани за текущия специалист">
              {currentCharacter.examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyExamplePrompt(ex)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm text-stone-700 dark:text-stone-200 transition flex items-start gap-2 border border-stone-200/80 dark:border-stone-600/80 bg-white/80 dark:bg-stone-900/60 hover:border-teal-400/45 hover:bg-teal-500/[0.06] dark:hover:bg-teal-500/10">
                  <MessageCircle size={14} className="text-teal-600/70 dark:text-teal-400/80 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{ex}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-xl sm:text-2xl mb-2 text-stone-900 dark:text-stone-50">{currentCharacter.greeting}</p>
                <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                  {currentCharacter.introduction}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-[#F1EFE8] dark:bg-stone-700 text-[#1C1917] dark:text-stone-50"
                          : ""
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              borderTopRightRadius: "4px",
                            }
                          : {
                              background: currentCharacter.bgColor,
                              color: currentCharacter.textColor,
                              borderTopLeftRadius: "4px",
                            }
                      }
                    >
                      <span className="block whitespace-pre-wrap">{msg.content}</span>
                      {msg.role === "assistant" && msg.replySource === "internal_kb" && (
                        <span className="mt-2 block text-[10px] uppercase tracking-wide opacity-75 border-t border-black/10 dark:border-white/15 pt-2">
                          От база знания · следващите съобщения ползват външен AI
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl"
                      style={{ background: currentCharacter.bgColor }}>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: currentCharacter.primaryColorHex }}></span>
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: currentCharacter.primaryColorHex, animationDelay: "0.1s" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: currentCharacter.primaryColorHex, animationDelay: "0.2s" }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="shrink-0 p-4 border-t border-stone-100 dark:border-stone-700 flex flex-col sm:flex-row gap-2 bg-white dark:bg-stone-900/95">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Питай ${currentCharacter.name}...`}
              className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:border-teal-500/55 dark:focus:border-teal-500/50 transition bg-white dark:bg-stone-950/80 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-4 py-2.5 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5 w-full sm:w-auto"
              style={{ background: currentCharacter.primaryColorHex }}
            >
              <Send size={14} />
              Изпрати
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <Link 
          href="/search"
          className="block bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-stone-700 p-6 hover:border-stone-300 dark:hover:border-teal-600/40 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#ecfdf8] dark:bg-teal-950/75">
              <Search size={20} className="text-stone-700 dark:text-teal-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-1">Търсачка за документи и схеми</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">Намери нужната информация за секунди - ДФЗ субсидии, наредби, срокове.</p>
            </div>
            <ArrowRight size={18} className="text-stone-400 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-teal-300 transition" />
          </div>
        </Link>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#E3EEF9] dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/50"
              aria-hidden
            >
              <Scale size={22} className="text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100 text-lg mb-2 tracking-tight">
                Как AgriNexus.Law помага на фермерите
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
                Името <strong className="font-medium text-stone-800 dark:text-stone-200">.Law</strong> показва основния фокус:
                норми, срокове и административни стъпки около ДФЗ и ОСП — обяснени ясно на български, за да се ориентираш по-бързо без да ровиш из десетки източника.
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
                На едно място са <strong className="font-medium text-stone-800 dark:text-stone-200">Елена</strong> (право и процедури),{" "}
                <strong className="font-medium text-stone-800 dark:text-stone-200">Борис</strong> (поле и култури) и{" "}
                <strong className="font-medium text-stone-800 dark:text-stone-200">Виктория</strong> (сметки и ориентири по подпомагане), заедно с търсачка по документи и сезонен календар — по-малко объркване около сроковете и схемите, повече спокойствие при решенията в стопанството.
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-500 leading-relaxed border-t border-stone-100 dark:border-stone-700 pt-3 mt-1">
                Това са AI асистенти за обща информация и ориентация — не заместват адвокат, агроном или счетоводител по конкретен казус.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="waitlist" className="max-w-3xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="rounded-2xl p-8 md:p-10 text-center text-white"
          style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
          <div className="text-3xl mb-3">🤝</div>
          <h2 className="text-2xl md:text-3xl font-medium mb-2">
            Целият екип те чака
          </h2>
          <p className="text-teal-50 mb-6 max-w-md mx-auto leading-relaxed">
            Първите 100 фермери получават достъп до всички специалисти. Безплатно за първата година.
          </p>

          {waitlistError && (
            <div className="mb-4 text-sm text-teal-50 bg-black/10 rounded-lg px-3 py-2">
              {waitlistError}
            </div>
          )}
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-teal-50">
              <Check size={20} />
              <span>Благодарим! Провери имейла си за подробности.</span>
            </div>
          ) : (
            <form 
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="как да те намерим? (имейл)"
                className="flex-1 px-4 py-3 rounded-lg text-stone-900 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white rounded-lg font-medium text-sm transition hover:bg-stone-50"
                style={{ color: "#0d9488" }}
              >
                Запознай се 🌾
              </button>
            </form>
          )}
          
          <p className="text-xs text-teal-100 mt-4 opacity-75">
            Ще се чуем след 24 часа. Обещаваме.
          </p>
        </div>
      </section>

      <footer className="bg-white dark:bg-stone-950/95 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">© 2026 Agri<span className="brand-nexus-gold">Nexus</span><span className="brand-law-suffix">.Law</span> — Помагаме на българските фермери.</p>
            <div className="flex gap-4 text-sm text-stone-500 dark:text-stone-400">
              <Link href="/terms" className="hover:text-stone-700 dark:hover:text-teal-300">Условия</Link>
              <Link href="/privacy" className="hover:text-stone-700 dark:hover:text-teal-300">Поверителност</Link>
            </div>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-4 text-center max-w-2xl mx-auto leading-relaxed">
            Елена, Борис и Виктория са AI асистенти за обща информация и ориентация.
            Не заместват професионална юридическа, агрономическа или финансова консултация за конкретни казуси.
          </p>
        </div>
      </footer>
    </div>
  );
}

function CharacterCard({ 
  character, 
  isActive, 
  onSelect 
}: { 
  character: Character; 
  isActive: boolean; 
  onSelect: () => void; 
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 sm:p-5 rounded-xl transition-all duration-200 premium-card ${isActive ? "premium-card-active" : ""}`}
    >
      <div className="flex items-start gap-4 mb-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${character.primaryColorHex}, ${character.textColor})` }}>
          {character.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm sm:text-base text-stone-900 dark:text-stone-50 mb-0.5">{character.fullName}</p>
          <p className={`text-xs font-medium mb-1 ${CHARACTER_ACCENT[character.id]}`}>
            {character.product}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-300">{character.productTagline}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t premium-divider">
        <span
          className={`text-xs flex items-center gap-1.5 ${
            isActive ? "text-teal-800 dark:text-teal-300" : "text-teal-800 dark:text-teal-400"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "gold-dot" : "bg-teal-500 dark:bg-teal-400"}`}></span>
          онлайн сега
        </span>
        <span className={`text-xs flex items-center gap-1 ${isActive ? "text-teal-800 dark:text-teal-300" : CHARACTER_ACCENT[character.id]}`}>
          {isActive ? "Избран ✓" : "Започни чат"} <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}
