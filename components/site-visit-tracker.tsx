"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "agrinexus_site_visit_recorded_v1";

/** По подразбиране показваме брояча, ако Redis е настроен (Vercel + UPSTASH_*). Скриване: NEXT_PUBLIC_SHOW_VISIT_COUNTER=0 */
const hidePublicCounter =
  process.env.NEXT_PUBLIC_SHOW_VISIT_COUNTER === "0";

/**
 * На заден план: веднъж на браузър сесия POST /api/stats/visits (ако има Redis).
 * GET за общия брой — показва се като „utility“ лентичка (подобно на live сайтове с публичен трафик).
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

      if (hidePublicCounter) return;

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

  if (hidePublicCounter || total === null) {
    return null;
  }

  return (
    <p
      className="pointer-events-none fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[35] select-none rounded-md border border-amber-200/60 bg-amber-50/95 px-2.5 py-1 font-[system-ui] text-[11px] font-medium uppercase tracking-[0.12em] text-amber-950/85 shadow-sm tabular-nums dark:border-teal-700/40 dark:bg-slate-950/90 dark:text-teal-100/90 sm:text-xs sm:tracking-[0.14em]"
      title="Приблизителен брой записани посещения (сесии; Upstash Redis)"
      aria-live="polite"
    >
      <span className="text-amber-800/70 dark:text-teal-300/80">Посещения</span>
      <span className="mx-1.5 text-amber-950/40 dark:text-teal-200/35" aria-hidden>
        ·
      </span>
      <span className="normal-case tracking-normal">
        {total.toLocaleString("bg-BG")}
      </span>
    </p>
  );
}
