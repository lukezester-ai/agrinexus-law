/**
 * Logs safe build-time env diagnostics (no secrets) for Vercel CI output.
 */
function clean(raw) {
	return raw?.trim().replace(/^"+|"+$/g, "") ?? "";
}

function resolveUrl(raw) {
	const cleaned = clean(raw);
	if (!cleaned) return null;
	const candidate = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
	try {
		const url = new URL(candidate);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		return url.origin;
	} catch {
		return null;
	}
}

const url = resolveUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const siteUrl = clean(process.env.NEXT_PUBLIC_SITE_URL);

console.log("[build-env] commit:", process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local");
console.log("[build-env] branch:", process.env.VERCEL_GIT_COMMIT_REF ?? "local");
console.log("[build-env] supabase url ok:", Boolean(url), url ? `(${url})` : "");
console.log("[build-env] supabase anon key set:", Boolean(anonKey));
console.log("[build-env] site url:", siteUrl || "(default agrinexuslaw.com)");

if (process.env.NEXT_PUBLIC_SUPABASE_URL && !url) {
	console.warn(
		"[build-env] WARNING: NEXT_PUBLIC_SUPABASE_URL is set but invalid — auth will be disabled until fixed.",
	);
}
