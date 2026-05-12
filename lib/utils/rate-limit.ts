import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function validUpstashConfig(): { url: string; token: string } | null {
  // Support both native Upstash vars and Vercel KV aliases.
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  if (!url.startsWith("https://")) return null;
  if (url.includes("...") || token.includes("...")) return null;
  return { url, token };
}

const upstash = validUpstashConfig();
const redis = upstash
  ? new Redis({
      url: upstash.url,
      token: upstash.token,
    })
  : null;

/** Споделен Redis клиент за брояч на посещения и др. (null без env). */
export function getUpstashRedis(): Redis | null {
  return redis;
}

export const chatRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:chat",
    })
  : null;

export const waitlistRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      analytics: true,
      prefix: "ratelimit:waitlist",
    })
  : null;

export const authMagicLinkRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "ratelimit:auth-magic-link",
    })
  : null;

export const searchRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "1 m"),
      analytics: true,
      prefix: "ratelimit:search",
    })
  : null;

/** RAG insights за статистики — вдига embeddings; по-строг лимит от общото търсене. */
export const statistikiInsightsRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "ratelimit:statistiki-insights",
    })
  : null;

/** POST към брояч на посещения — ограничение срещу надуване на брояча. */
export const visitCounterPostRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: true,
      prefix: "ratelimit:visit-counter-post",
    })
  : null;

export async function checkRateLimit(
  rateLimit: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
}> {
  if (!rateLimit) {
    return { success: true };
  }

  const result = await rateLimit.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
  };
}

export function extractClientIp(req: Request): string {
  const firstFromHeader = (headerValue: string | null): string | null => {
    if (!headerValue) return null;
    const first = headerValue.split(",")[0]?.trim();
    return first || null;
  };

  const forwarded =
    firstFromHeader(req.headers.get("x-forwarded-for")) ||
    firstFromHeader(req.headers.get("x-real-ip")) ||
    firstFromHeader(req.headers.get("cf-connecting-ip"));

  return forwarded || "unknown";
}
