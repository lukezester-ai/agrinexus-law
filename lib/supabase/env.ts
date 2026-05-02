/** Публични променливи за браузъра и Edge middleware. */
export function isSupabaseAuthConfigured(): boolean {
	return Boolean(
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
	);
}
