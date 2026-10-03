"use server";

import { createClient } from "@/lib/supabase-server";

const ALLOWED = new Set([
	"qualify_business_match",
	"request_business_match_introduction",
	"respond_business_match_introduction",
]);

export async function runRadarAction(
	fn: string,
	args: Record<string, string | boolean>,
): Promise<{ error: string | null }> {
	if (!ALLOWED.has(fn)) return { error: "Unknown action." };
	const supabase = createClient();
	const { data } = await supabase.auth.getUser();
	if (!data.user) return { error: "Sign in again, then retry." };
	const { error } = await supabase.rpc(fn, args);
	return { error: error?.message ?? null };
}
