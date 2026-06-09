import { createHash } from "crypto";
import {
  getSiteVisitStats,
  incrementSiteVisitTotal,
  isSiteVisitCounterConfigured,
} from "@/lib/site-visit-counter";
import {
  checkRateLimit,
  extractClientIp,
  visitCounterPostRateLimit,
} from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

function buildVisitorId(req: Request): string {
  const ip = extractClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const language = req.headers.get("accept-language") || "unknown";
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${language}`)
    .digest("hex");
}

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
  const stats = await getSiteVisitStats();
  return Response.json({
    ok: true as const,
    configured: true,
    total: stats.totalVisits,
    totalVisits: stats.totalVisits,
    uniqueVisitors: stats.uniqueVisitors,
  });
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

  const stats = await incrementSiteVisitTotal(buildVisitorId(req));
  return Response.json({
    ok: true as const,
    total: stats?.totalVisits ?? 0,
    totalVisits: stats?.totalVisits ?? 0,
    uniqueVisitors: stats?.uniqueVisitors ?? 0,
    remaining: rl.remaining,
  });
}
