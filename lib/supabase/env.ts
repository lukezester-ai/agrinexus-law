/**
 * Синхронизирай с `next dev -p …` в `package.json` (`npm run dev`).
 * Използва се за подсказки към Supabase Redirect URLs при локален magic link.
 */
export const DEV_SERVER_DEFAULT_PORT = 3002;

export function getLocalAuthCallbackUrl(
	port: number = DEV_SERVER_DEFAULT_PORT,
): string {
	return `http://localhost:${port}/auth/callback`;
}

/** Публични променливи за браузъра и Edge middleware. */
export function isSupabaseAuthConfigured(): boolean {
	return Boolean(
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
	);
}
