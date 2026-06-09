import { getUpstashRedis } from "@/lib/utils/rate-limit";

const VISIT_TOTAL_KEY = "agrinexus:stats:site-visits-total";
const UNIQUE_VISITORS_KEY = "agrinexus:stats:site-visitors-unique";

export type SiteVisitStats = {
	totalVisits: number;
	uniqueVisitors: number;
};

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

export async function getUniqueVisitorTotal(): Promise<number> {
	const r = getUpstashRedis();
	if (!r) return 0;
	const raw = await r.scard(UNIQUE_VISITORS_KEY);
	return typeof raw === "number" ? raw : Number(raw ?? 0);
}

export async function getSiteVisitStats(): Promise<SiteVisitStats> {
	const [totalVisits, uniqueVisitors] = await Promise.all([
		getSiteVisitTotal(),
		getUniqueVisitorTotal(),
	]);

	return { totalVisits, uniqueVisitors };
}

export async function incrementSiteVisitTotal(visitorId?: string): Promise<SiteVisitStats | null> {
	const r = getUpstashRedis();
	if (!r) return null;

	const totalVisits = await r.incr(VISIT_TOTAL_KEY);
	if (visitorId) {
		await r.sadd(UNIQUE_VISITORS_KEY, visitorId);
	}

	return {
		totalVisits: typeof totalVisits === "number" ? totalVisits : Number(totalVisits),
		uniqueVisitors: await getUniqueVisitorTotal(),
	};
}
