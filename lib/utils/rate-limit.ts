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
const isProd = process.env.NODE_ENV === "production";
const redis = upstash
  ? new Redis({
      url: upstash.url,
      token: upstash.token,
    })
  : null;

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

export const searchRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "1 m"),
      analytics: true,
      prefix: "ratelimit:search",
    })
  : null;

export async function checkRateLimit(
  rateLimit: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reason?: "not_configured";
}> {
  if (!rateLimit) {
    if (isProd) {
      return { success: false, reason: "not_configured" };
    }
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
