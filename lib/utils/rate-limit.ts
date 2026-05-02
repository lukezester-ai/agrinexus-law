import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function validUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
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
): Promise<{ success: boolean; limit?: number; remaining?: number }> {
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
