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

  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 premium-nav backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base border"
              style={{
                background: "linear-gradient(135deg, rgba(244,224,174,0.14), rgba(201,146,42,0.2))",
                borderColor: "rgba(226,188,107,0.45)",
                color: "#E2BC6B",
              }}
              aria-hidden="true"
            >
              🌾
            </div>
            <div>
              <div className="font-semibold text-sm sm:text-base leading-none tracking-tight">
                <span className="text-white">Agri</span><span className="brand-nexus-gold">Nexus</span><span className="brand-law-suffix">.Law</span>
              </div>
              <div className="text-[11px] sm:text-xs text-emerald-50/75 mt-1">Твоят земеделски екип</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 text-sm">
            <Link
              href="/kalkulator"
              className="text-emerald-50/80 hover:text-amber-200 flex items-center gap-1 transition-colors font-medium"
              title="Ориентировъчни субсидии"
            >
              <Calculator size={14} aria-hidden />
              <span className="hidden sm:inline">Калкулатор</span>
            </Link>
            <Link
              href="/search"
              className="text-emerald-50/80 hover:text-amber-200 flex items-center gap-1 sm:gap-1.5 transition-colors"
              title="Търсачка по субсидии и ДФЗ"
            >
              <Search size={14} aria-hidden />
              <span className="max-[380px]:sr-only">Търсачка</span>
            </Link>
            {auth.status === "signed_in" && (
              <Link
                href="/moya-ferma"
                className="text-emerald-50/80 hover:text-amber-200 flex items-center gap-1 transition-colors font-medium"
                title="Моя ферма">
                <Wheat size={14} aria-hidden />
                <span className="hidden sm:inline">Моя ферма</span>
              </Link>
            )}
            {(auth.status === "anonymous" || auth.status === "unconfigured") && (
              <Link
                href="/vhod"
                className="text-emerald-50/80 hover:text-amber-200 flex items-center gap-1 transition-colors"
                title="Вход за регистрирани потребители">
                <LogIn size={14} aria-hidden />
                <span className="hidden sm:inline">Вход</span>
              </Link>
            )}
            <Link
              href="/documents"
              className="text-emerald-50/80 hover:text-amber-200 flex items-center gap-1 transition-colors"
              title="Мои документи">
              <FolderOpen size={14} aria-hidden />
              <span className="hidden lg:inline">Документи</span>
            </Link>
            <Link href="/profile" className="text-emerald-50/80 hover:text-amber-200 flex items-center gap-1 transition-colors">
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
            <span className="text-[#0F6E56] dark:text-emerald-300">Agri</span>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg ring-2 ring-amber-400/60 ring-offset-2 ring-offset-transparent"
            style={{ background: "#B45309" }}
          >
            <Calculator size={16} aria-hidden />
            Калкулатор на субсидии
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg"
            style={{ background: "#0F6E56" }}
          >
            <Search size={16} aria-hidden />
            Търси в базата знания (ДФЗ)
          </Link>
          {!profileReady && (
            <Link
              href="/profile"
              className="inline-flex items-center text-sm text-stone-700 dark:text-emerald-100/90 hover:text-stone-900 dark:hover:text-white underline decoration-amber-600/70 underline-offset-2 py-1"
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
        <div className="bg-white dark:bg-stone-900/95 rounded-2xl shadow-soft border border-emerald-100/70 dark:border-emerald-900/40 overflow-hidden luxury-glow">
          <div className="p-4 border-b flex items-center gap-3"
            style={{ background: currentCharacter.bgColor, borderColor: "rgba(0,0,0,0.05)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${currentCharacter.primaryColorHex}, ${currentCharacter.textColor})` }}>
              {currentCharacter.avatar}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: currentCharacter.textColor }}>
                {currentCharacter.fullName}
              </div>
              <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: currentCharacter.textColor }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                онлайн · {currentCharacter.role}
              </div>
            </div>
            {profileReady && (
              <div className="text-xs px-2 py-1 rounded-md bg-white/50" style={{ color: currentCharacter.textColor }}>
                Знам твоя профил
              </div>
            )}
          </div>

          <div className="p-4 min-h-[260px] sm:min-h-[300px] max-h-[420px] sm:max-h-[450px] overflow-y-auto">
            {messages.length === 0 ? (
              <div>
                <div className="text-center mb-4">
                  <p className="text-2xl mb-1 text-stone-900 dark:text-stone-50">{currentCharacter.greeting}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                    {currentCharacter.introduction}
                  </p>
                </div>
                <div className="space-y-2 mt-6">
                  <p className="text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2 text-center">
                    Опитай нещо такова
                  </p>
                  {currentCharacter.examples.map((ex, i) => (
                    <button 
                      key={i}
                      onClick={() => applyExamplePrompt(ex)}
                      className="w-full text-left px-4 py-3 bg-stone-50 dark:bg-stone-800/90 hover:bg-stone-100 dark:hover:bg-stone-700/90 rounded-lg text-sm text-stone-700 dark:text-stone-200 transition flex items-center gap-2 border border-transparent dark:border-stone-700/80"
                    >
                      <MessageCircle size={14} className="text-stone-400 dark:text-stone-500 flex-shrink-0" />
                      <span>{ex}</span>
                    </button>
                  ))}
                </div>
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

          <form onSubmit={handleChatSubmit} className="p-4 border-t border-stone-100 dark:border-stone-700 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Питай ${currentCharacter.name}...`}
              className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:border-stone-400 dark:focus:border-emerald-500/60 transition bg-white dark:bg-stone-950/80 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
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
          className="block bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-stone-700 p-6 hover:border-stone-300 dark:hover:border-emerald-600/40 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#F1EFE8] dark:bg-emerald-950/80">
              <Search size={20} className="text-stone-700 dark:text-emerald-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-1">Търсачка за документи и схеми</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">Намери нужната информация за секунди - ДФЗ субсидии, наредби, срокове.</p>
            </div>
            <ArrowRight size={18} className="text-stone-400 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-emerald-300 transition" />
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
          style={{ background: "linear-gradient(135deg, #0F6E56, #1D9E75)" }}>
          <div className="text-3xl mb-3">🤝</div>
          <h2 className="text-2xl md:text-3xl font-medium mb-2">
            Целият екип те чака
          </h2>
          <p className="text-emerald-50 mb-6 max-w-md mx-auto leading-relaxed">
            Първите 100 фермери получават достъп до всички специалисти. Безплатно за първата година.
          </p>

          {waitlistError && (
            <div className="mb-4 text-sm text-amber-100 bg-black/10 rounded-lg px-3 py-2">
              {waitlistError}
            </div>
          )}
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-emerald-50">
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
                style={{ color: "#0F6E56" }}
              >
                Запознай се 🌾
              </button>
            </form>
          )}
          
          <p className="text-xs text-emerald-100 mt-4 opacity-75">
            Ще се чуем след 24 часа. Обещаваме.
          </p>
        </div>
      </section>

      <footer className="bg-white dark:bg-stone-950/95 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">© 2026 Agri<span className="brand-nexus-gold">Nexus</span><span className="brand-law-suffix">.Law</span> — Помагаме на българските фермери.</p>
            <div className="flex gap-4 text-sm text-stone-500 dark:text-stone-400">
              <Link href="/terms" className="hover:text-stone-700 dark:hover:text-emerald-300">Условия</Link>
              <Link href="/privacy" className="hover:text-stone-700 dark:hover:text-emerald-300">Поверителност</Link>
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
            isActive ? "text-amber-800 dark:text-amber-400" : "text-emerald-800 dark:text-emerald-400"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "gold-dot" : "bg-emerald-500 dark:bg-emerald-400"}`}></span>
          онлайн сега
        </span>
        <span className={`text-xs flex items-center gap-1 ${isActive ? "text-amber-800 dark:text-amber-400" : CHARACTER_ACCENT[character.id]}`}>
          {isActive ? "Избран ✓" : "Започни чат"} <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}
