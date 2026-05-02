import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseAuthConfigured } from "./env";

/** Клиент за използване само в Client Components. Връща null ако липсват env (демо режим). */
export function createBrowserSupabaseClient() {
	if (!isSupabaseAuthConfigured()) return null;
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
	return createBrowserClient(url, key);
}
