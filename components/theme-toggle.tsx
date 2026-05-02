"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "agrinexus-theme";

function applyTheme(mode: "dark" | "light") {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem(KEY) as "dark" | "light" | null;
      if (s === "light" || s === "dark") {
        setMode(s);
        applyTheme(s);
      } else {
        setMode("dark");
        applyTheme("dark");
      }
    } catch {
      setMode("dark");
      applyTheme("dark");
    }
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[100] h-12 w-12 rounded-full border border-stone-600/50 bg-stone-800/80"
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-stone-500/40 bg-stone-200/90 text-stone-800 shadow-lg backdrop-blur-sm transition hover:brightness-110 dark:border-emerald-500/30 dark:bg-stone-900/90 dark:text-amber-200"
      title={mode === "dark" ? "Светла тема" : "Тъмна тема"}
      aria-label={mode === "dark" ? "Превключи на светла тема" : "Превключи на тъмна тема"}
    >
      {mode === "dark" ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
    </button>
  );
}
