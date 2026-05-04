import type { FarmProfileSnapshot } from "@/lib/farm-profile";
import { sanitizeFarmProfilePayload } from "@/lib/farm-profile-server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FarmProfileResolutionSource =
	| "supabase_metadata"
	| "client_sanitized"
	| "none";

/**
 * Сървърно разрешаване на профила за чат:
 * 1) при активна сесия — от Supabase `user.user_metadata.farm_profile` (санитизиран);
 * 2) иначе — санитизиран обект от тялото на заявката (както досега от localStorage).
 */
export async function resolveFarmProfileForChat(
	clientBodyProfile: unknown,
): Promise<{ profile: FarmProfileSnapshot | null; source: FarmProfileResolutionSource }> {
	if (isSupabaseAuthConfigured()) {
		try {
			const supabase = await createSupabaseServerClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			const meta = user?.user_metadata as Record<string, unknown> | undefined;
			if (meta?.farm_profile != null) {
				const fromMeta = sanitizeFarmProfilePayload(meta.farm_profile);
				if (fromMeta) return { profile: fromMeta, source: "supabase_metadata" };
			}
		} catch {
			/* без сесия или грешка при четене — падаме към клиентския payload */
		}
	}

	const fromClient = sanitizeFarmProfilePayload(clientBodyProfile);
	if (fromClient) return { profile: fromClient, source: "client_sanitized" };
	return { profile: null, source: "none" };
}
