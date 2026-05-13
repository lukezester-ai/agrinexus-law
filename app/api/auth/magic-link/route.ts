import { createClient } from "@supabase/supabase-js";
import { authMagicLinkRateLimit, checkRateLimit, extractClientIp } from "@/lib/utils/rate-limit";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { isValidEmail, normalizeEmail } from "@/lib/validation/email";

type MagicLinkRequest = {
	email?: string;
	redirectTo?: string;
};

export async function POST(req: Request) {
	if (!isSupabaseAuthConfigured()) {
		return Response.json(
			{ error: "Auth конфигурацията не е активна." },
			{ status: 503 },
		);
	}

	try {
		const ip = extractClientIp(req);
		const rateLimitResult = await checkRateLimit(authMagicLinkRateLimit, ip);
		if (!rateLimitResult.success) {
			return Response.json(
				{ error: "Твърде много опити. Опитай отново след малко." },
				{ status: 429 },
			);
		}

		const body = (await req.json()) as MagicLinkRequest;
		if (!isValidEmail(body.email)) {
			return Response.json({ error: "Невалиден имейл адрес." }, { status: 400 });
		}

		const next =
			typeof body.redirectTo === "string" &&
			body.redirectTo.startsWith("/") &&
			!body.redirectTo.startsWith("//")
				? body.redirectTo
				: "/moya-ferma";

		const origin = new URL(req.url).origin;
		const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
		);

		const { error } = await supabase.auth.signInWithOtp({
			email: normalizeEmail(body.email),
			options: {
				emailRedirectTo,
				// Първи път: създава акаунт; след това същият поток е вход.
				shouldCreateUser: true,
			},
		});

		if (error) {
			const raw = error.message || "Неуспешно изпращане. Опитай пак.";
			const lower = raw.toLowerCase();
			let userMessage = raw;
			if (
				lower.includes("signups not allowed") ||
				lower.includes("email address is not authorized")
			) {
				userMessage =
					"Регистрацията с този имейл не е разрешена в проекта Supabase. Провери Authentication → Providers / настройките за signup.";
			}
			return Response.json({ error: userMessage }, { status: 400 });
		}

		return Response.json({ success: true });
	} catch (error) {
		console.error("Magic link error:", error);
		return Response.json(
			{ error: "Възникна грешка при изпращане на линка." },
			{ status: 500 },
		);
	}
}
