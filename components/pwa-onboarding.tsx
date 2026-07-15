"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Monitor, Smartphone, Share2, CheckCircle2, X } from "lucide-react";

const SEEN_KEY = "agrinexus-pwa-onboarding-seen";
const SESSION_HIDE_KEY = "agrinexus-pwa-onboarding-session-hide";
const OPEN_HELP_EVENT = "agrinexus:open-help";
const OPEN_INSTALL_EVENT = "agrinexus:install-pwa";

export function PwaOnboarding() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [openMode, setOpenMode] = useState<"onboarding" | "install">("onboarding");
  const [canInstallNative, setCanInstallNative] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstallable = () => {
      if (window.__deferredPwaPrompt) {
        setCanInstallNative(true);
      }
    };

    checkInstallable();

    const seen = window.localStorage.getItem(SEEN_KEY) === "1";
    const sessionHidden = window.sessionStorage.getItem(SESSION_HIDE_KEY) === "1";
    if (!seen && !sessionHidden) {
      setOpenMode("onboarding");
      setOpen(true);
    }

    const handleOpenHelp = () => {
      setOpenMode("install");
      checkInstallable();
      setOpen(true);
    };

    const handleOpenInstall = () => {
      setOpenMode("install");
      if (window.__deferredPwaPrompt) {
        // Ако имаме готов native prompt от Chrome/Edge, директно го викаме!
        window.__deferredPwaPrompt.prompt();
        window.__deferredPwaPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            window.__deferredPwaPrompt = undefined;
            setCanInstallNative(false);
            setInstalled(true);
            setOpen(false);
          }
        });
      } else {
        setOpen(true);
      }
    };

    const handleInstallable = () => {
      setCanInstallNative(true);
    };

    const handleInstalled = () => {
      setCanInstallNative(false);
      setInstalled(true);
    };

    window.addEventListener(OPEN_HELP_EVENT, handleOpenHelp);
    window.addEventListener(OPEN_INSTALL_EVENT, handleOpenInstall);
    window.addEventListener("agrinexus:pwa-installable", handleInstallable);
    window.addEventListener("agrinexus:pwa-installed", handleInstalled);

    return () => {
      window.removeEventListener(OPEN_HELP_EVENT, handleOpenHelp);
      window.removeEventListener(OPEN_INSTALL_EVENT, handleOpenInstall);
      window.removeEventListener("agrinexus:pwa-installable", handleInstallable);
      window.removeEventListener("agrinexus:pwa-installed", handleInstalled);
    };
  }, []);

  const handleNativeInstallClick = async () => {
    if (!window.__deferredPwaPrompt) return;
    try {
      window.__deferredPwaPrompt.prompt();
      const choiceResult = await window.__deferredPwaPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        window.__deferredPwaPrompt = undefined;
        setCanInstallNative(false);
        setInstalled(true);
        setOpen(false);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
  };

  const content = useMemo(() => {
    if (pathname.startsWith("/search") || pathname.startsWith("/documents")) {
      return {
        title: "Помощ за търсене и документи",
        text: "Използвай естествен език в търсачката и отвори оригиналния източник за проверка на детайлите.",
      };
    }
    if (pathname.startsWith("/srokove")) {
      return {
        title: "Помощ за срокове",
        text: "Следи секцията за важни дати и проверявай редовно, за да не изпуснеш кампания или подаване.",
      };
    }
    if (pathname.startsWith("/kalkulator")) {
      return {
        title: "Помощ за калкулатори",
        text: "Въведи реални данни за площи и разходи, за да получиш по-точни сметки и сравнение на варианти.",
      };
    }
    return {
      title: "Добре дошъл в AgriNexus",
      text: "Инсталираното приложение работи като самостоятелна app версия с бърз достъп до всички 18 модула, калкулатори и AI асистент.",
    };
  }, [pathname]);

  const closeForSession = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_HIDE_KEY, "1");
    }
    setOpen(false);
  };

  const dismissForever = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SEEN_KEY, "1");
      window.sessionStorage.setItem(SESSION_HIDE_KEY, "1");
    }
    setOpen(false);
  };

  if (!open) return null;

  if (openMode === "install") {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Download size={18} />
              </div>
              <div>
                <h2 className="text-base font-black">Инсталиране на AgriNexus (PWA)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Работи офлайн и директно от началния ви екран</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="py-5 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {canInstallNative ? (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/40 p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  <CheckCircle2 size={18} />
                  <span>Вашият браузър поддържа 1-Click Инсталиране!</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Кликнете на бутона по-долу, за да инсталирате AgriNexus като самостоятелно приложение за вашия компютър или телефон веднага.
                </p>
                <button
                  type="button"
                  onClick={handleNativeInstallClick}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>Инсталирай приложението сега</span>
                </button>
              </div>
            ) : installed ? (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                🎉 Приложението е успешно инсталирано! Можете да го стартирате от иконата на работното ви място или начален екран.
              </div>
            ) : null}

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ръчно инсталиране според устройството
              </h3>

              {/* Chrome / Edge Desktop */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-indigo-600 dark:text-indigo-400">
                  <Monitor size={15} />
                  <span>Google Chrome / Microsoft Edge (Компютър)</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-5 list-decimal font-medium">
                  <li>Погледнете в <strong className="text-slate-900 dark:text-white">дясната част на адресната лента</strong> (горе до URL адреса).</li>
                  <li>Кликнете върху иконата за инсталиране <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">💻</span> или <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">➕</span>.</li>
                  <li>Или от менюто с 3 точки <strong className="text-slate-900 dark:text-white">(⋮ / ⋯)</strong> изберете <strong className="text-emerald-600 dark:text-emerald-400">„Инсталирай приложението (Install AgriNexus)“</strong>.</li>
                </ol>
              </div>

              {/* Chrome Android */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-600 dark:text-emerald-400">
                  <Smartphone size={15} />
                  <span>Google Chrome / Edge (Android телефон / таблет)</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-5 list-decimal font-medium">
                  <li>Отворете менюто на браузъра с 3 точки <strong className="text-slate-900 dark:text-white">(⋮)</strong> в горния десен ъгъл.</li>
                  <li>Кликнете върху <strong className="text-emerald-600 dark:text-emerald-400">„Инсталирай приложението“</strong> (или „Добави към начален екран / Install app“).</li>
                  <li>Потвърдете с бутона <strong className="text-slate-900 dark:text-white">„Инсталирай“</strong>.</li>
                </ol>
              </div>

              {/* Safari iOS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-sky-600 dark:text-sky-400">
                  <Share2 size={15} />
                  <span>Safari (iPhone / iPad)</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-5 list-decimal font-medium">
                  <li>Кликнете върху бутона за споделяне <strong className="text-sky-600 dark:text-sky-400">[ 📤 Share / Сподели ]</strong> най-долу в центъра на екрана.</li>
                  <li>Превъртете надолу в менюто и изберете <strong className="text-slate-900 dark:text-white">„Добави към начален екран (Add to Home Screen ➕)“</strong>.</li>
                  <li>Кликнете <strong className="text-slate-900 dark:text-white">„Добави (Add)“</strong> горе вдясно.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Затвори упътването
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-indigo-200 bg-white p-5 shadow-2xl dark:border-indigo-900/50 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {content.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {content.text}
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeForSession}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Затвори
          </button>
          <button
            type="button"
            onClick={dismissForever}
            className="brand-cta-bg rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Не показвай повече
          </button>
        </div>
      </div>
    </div>
  );
}
