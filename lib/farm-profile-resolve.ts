import type { FarmProfileSnapshot } from "@/lib/farm-profile";
import { sanitizeFarmProfilePayload } from "@/lib/farm-profile-server";

export type FarmProfileResolutionSource = "client_sanitized" | "none";

/** Профил за чат: само санитизиран payload от клиента (localStorage). */
export async function resolveFarmProfileForChat(
	clientBodyProfile: unknown,
): Promise<{ profile: FarmProfileSnapshot | null; source: FarmProfileResolutionSource }> {
	const fromClient = sanitizeFarmProfilePayload(clientBodyProfile);
	if (fromClient) return { profile: fromClient, source: "client_sanitized" };
	return { profile: null, source: "none" };
}
