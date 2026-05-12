import { getUpstashRedis } from "@/lib/utils/rate-limit";

const VISIT_TOTAL_KEY = "agrinexus:stats:site-visits-total";

export function isSiteVisitCounterConfigured(): boolean {
  return getUpstashRedis() !== null;
}

export async function getSiteVisitTotal(): Promise<number> {
  const r = getUpstashRedis();
  if (!r) return 0;
  const raw = await r.get(VISIT_TOTAL_KEY);
  if (raw === null || raw === undefined) return 0;
  return typeof raw === "number" ? raw : Number(raw);
}

/** Връща новата стойност след инкремент. */
export async function incrementSiteVisitTotal(): Promise<number | null> {
  const r = getUpstashRedis();
  if (!r) return null;
  const n = await r.incr(VISIT_TOTAL_KEY);
  return typeof n === "number" ? n : Number(n);
}
