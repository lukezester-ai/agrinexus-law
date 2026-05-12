import {
  getSiteVisitTotal,
  incrementSiteVisitTotal,
  isSiteVisitCounterConfigured,
} from "@/lib/site-visit-counter";
import {
  checkRateLimit,
  extractClientIp,
  visitCounterPostRateLimit,
} from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

/** Публично четене на брояча (без секрет). */
export async function GET() {
  const configured = isSiteVisitCounterConfigured();
  if (!configured) {
    return Response.json({
      ok: true as const,
      configured: false,
      total: null,
    });
  }
  const total = await getSiteVisitTotal();
  return Response.json({ ok: true as const, configured: true, total });
}

/**
 * Записва едно посещение (обикновено веднъж на браузър сесия от клиента).
 * Изисква Upstash Redis; rate limited по IP.
 */
export async function POST(req: Request) {
  if (!isSiteVisitCounterConfigured()) {
    return Response.json(
      {
        ok: false,
        error:
          "Броячът не е активен — добавете UPSTASH_REDIS_* (или KV_REST_*) в средата.",
      },
      { status: 503 },
    );
  }

  const ip = extractClientIp(req);
  const rl = await checkRateLimit(visitCounterPostRateLimit, ip);
  if (!rl.success) {
    return Response.json(
      { ok: false, error: "Твърде много заявки към брояча." },
      { status: 429 },
    );
  }

  const total = await incrementSiteVisitTotal();
  return Response.json({
    ok: true as const,
    total: total ?? 0,
    remaining: rl.remaining,
  });
}
