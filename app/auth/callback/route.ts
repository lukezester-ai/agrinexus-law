import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	let next = searchParams.get("next") ?? "/moya-ferma";
	if (!next.startsWith("/") || next.startsWith("//")) {
		next = "/moya-ferma";
	}

	if (!isSupabaseAuthConfigured()) {
		return NextResponse.redirect(`${origin}/vhod?error=config`);
	}

	if (code) {
		const supabase = await createSupabaseServerClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
