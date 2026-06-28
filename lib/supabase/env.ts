/** Trim and strip accidental wrapping quotes from Vercel / dashboard paste. */
export function cleanEnvValue(raw: string | undefined): string {
	return raw?.trim().replace(/^"+|"+$/g, "") ?? "";
}

function parseHttpUrl(raw: string): URL | null {
	try {
		const url = new URL(raw);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		return url;
	} catch {
		return null;
	}
}

/** Resolve NEXT_PUBLIC_SUPABASE_URL; adds https:// when the host was pasted without a scheme. */
export function resolveSupabasePublicUrl(raw: string | undefined): string | null {
	const cleaned = cleanEnvValue(raw);
	if (!cleaned) return null;

	const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
	const url = parseHttpUrl(withScheme);
	return url ? url.origin : null;
}

export function resolveSupabaseAnonKey(raw: string | undefined): string | null {
	const key = cleanEnvValue(raw);
	return key || null;
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
	const url = resolveSupabasePublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
	const anonKey = resolveSupabaseAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
	if (!url || !anonKey) return null;
	return { url, anonKey };
}

export function isSupabasePublicEnvConfigured(): boolean {
	return getSupabasePublicEnv() !== null;
}
