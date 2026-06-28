"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const SEEN_KEY = "agrinexus-pwa-onboarding-seen";
const SESSION_HIDE_KEY = "agrinexus-pwa-onboarding-session-hide";
const OPEN_HELP_EVENT = "agrinexus:open-help";

export function PwaOnboarding() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

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
      title: "Добре дошъл в AgriNexus app",
      text: "Инсталираното приложение работи като самостоятелна app версия. За най-бърз достъп ползвай менюто: Документи, Срокове и Калкулатори.",
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(SEEN_KEY) === "1";
    const sessionHidden = window.sessionStorage.getItem(SESSION_HIDE_KEY) === "1";
    if (!seen && !sessionHidden) setOpen(true);

    const openHelp = () => setOpen(true);
    window.addEventListener(OPEN_HELP_EVENT, openHelp);
    return () => {
      window.removeEventListener(OPEN_HELP_EVENT, openHelp);
    };
  }, []);

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
