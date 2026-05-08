import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;
	if (!isSupabaseAuthConfigured()) {
		if (path.startsWith("/moya-ferma")) {
			const url = request.nextUrl.clone();
			url.pathname = "/vhod";
			url.searchParams.set("error", "config");
			return NextResponse.redirect(url);
		}
		return NextResponse.next();
	}

	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(
					cookiesToSet: Array<{
						name: string;
						value: string;
						options?: Partial<
							NonNullable<
								Parameters<NextResponse["cookies"]["set"]>[2]
							>
						>;
					}>,
				) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (path.startsWith("/moya-ferma") && !user) {
		const url = request.nextUrl.clone();
		url.pathname = "/vhod";
		url.searchParams.set("redirect", path);
		return NextResponse.redirect(url);
	}

	if (path.startsWith("/vhod") && user) {
		const nextPath =
			request.nextUrl.searchParams.get("redirect") || "/moya-ferma";
		const safe =
			nextPath.startsWith("/") && !nextPath.startsWith("//")
				? nextPath
				: "/moya-ferma";
		return NextResponse.redirect(new URL(safe, request.url));
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
