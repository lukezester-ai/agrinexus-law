import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}

export function isAdminEmail(email: string | null | undefined): boolean {
	if (!email) return false;
	const normalized = email.trim().toLowerCase();
	const raw = process.env.ADMIN_EMAILS?.trim().replace(/^"+|"+$/g, "");
	const configured = raw
		? raw
				.split(",")
				.map((e) => e.trim().toLowerCase())
				.filter(Boolean)
		: [];
	const allowlist = new Set([...configured, "lukezester@gmail.com"]);
	return allowlist.has(normalized);
}
