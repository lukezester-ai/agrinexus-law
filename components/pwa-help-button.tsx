"use client";

const OPEN_HELP_EVENT = "agrinexus:open-help";

export function PwaHelpButton() {
  const openHelp = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(OPEN_HELP_EVENT));
  };

  return (
    <button
      type="button"
      onClick={openHelp}
      className="fixed bottom-4 left-4 z-[60] rounded-full border border-indigo-300 bg-white/95 px-4 py-2 text-sm font-medium text-indigo-800 shadow-lg backdrop-blur hover:bg-white dark:border-indigo-800 dark:bg-stone-900/95 dark:text-indigo-200"
    >
      Помощ
    </button>
  );
}
