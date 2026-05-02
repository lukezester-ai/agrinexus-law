import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** За Server Components и Route Handlers (обмен на код за сесия). */
export async function createSupabaseServerClient() {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(
					cookiesToSet: Array<{
						name: string;
						value: string;
						options?: Parameters<typeof cookieStore.set>[2];
					}>,
				) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {
						/* извън Route Handler set може да не е позволен */
					}
				},
			},
		},
	);
}
