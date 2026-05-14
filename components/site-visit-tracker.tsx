"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "agrinexus_site_visit_recorded_v1";

const showPublicCounter =
  process.env.NEXT_PUBLIC_SHOW_VISIT_COUNTER === "1";

/**
 * На заден план: веднъж на браузър сесия POST /api/stats/visits (ако има Redis).
 * GET към същия endpoint само ако NEXT_PUBLIC_SHOW_VISIT_COUNTER=1 — за показване на число.
 */
export function SiteVisitTracker() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (typeof sessionStorage !== "undefined") {
          if (!sessionStorage.getItem(SESSION_KEY)) {
            await fetch("/api/stats/visits", { method: "POST" }).catch(
              () => undefined,
            );
            sessionStorage.setItem(SESSION_KEY, "1");
          }
        }
      } catch {
        /* private mode */
      }

      if (!showPublicCounter) return;

      try {
        const g = await fetch("/api/stats/visits", { cache: "no-store" });
        const j = (await g.json()) as {
          ok?: boolean;
          configured?: boolean;
          total?: number | null;
        };
        if (
          !cancelled &&
          j?.ok &&
          j.configured &&
          typeof j.total === "number"
        ) {
          setTotal(j.total);
        }
      } catch {
        /* ignore */
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!showPublicCounter || total === null) {
    return null;
  }

  return (
    <p
      className="pointer-events-none fixed bottom-14 left-3 z-[19] select-none rounded bg-stone-100/90 px-2 py-1 text-[11px] text-stone-500 shadow-sm dark:bg-stone-900/90 dark:text-stone-400"
      title="Приблизителен брой записани посещения (сесии с Redis)"
      aria-live="polite"
    >
      Посещения: {total.toLocaleString("bg-BG")}
    </p>
  );
}
