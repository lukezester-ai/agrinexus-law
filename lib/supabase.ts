import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Lazy admin client - avoids crashing route modules when env vars are missing or invalid. */
let adminClient: SupabaseClient | null = null;
let adminResolved = false;

function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function getSupabaseAdmin(): SupabaseClient | null {
	if (adminResolved) return adminClient;
	adminResolved = true;
	const url =
		process.env.SUPABASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (!url || !key || !isValidHttpUrl(url)) {
		adminClient = null;
		return null;
	}
	try {
		adminClient = createClient(url, key);
	} catch {
		adminClient = null;
	}
	return adminClient;
}

export interface WaitlistEntry {
	id?: string;
	email: string;
	farm_type?: string;
	farm_size?: number;
	region?: string;
	created_at?: string;
}

export interface ChatSession {
	id?: string;
	user_id: string;
	character_id: string;
	message: string;
	response: string;
	created_at?: string;
}

export interface FarmProfile {
	id?: string;
	user_id: string;
	farm_type: string;
	region: string;
	total_decares: number;
	crops: string[];
	livestock: string[];
	is_organic: boolean;
	created_at?: string;
}
