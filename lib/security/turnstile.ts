type TurnstileVerifyResponse = {
	success: boolean;
	"error-codes"?: string[];
};

export function isTurnstileConfigured(): boolean {
	return Boolean(
		process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() &&
			process.env.TURNSTILE_SECRET_KEY?.trim(),
	);
}

export async function verifyTurnstileToken(input: {
	token: string;
	remoteIp?: string;
}): Promise<boolean> {
	const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
	if (!secret) return false;

	const formData = new URLSearchParams();
	formData.set("secret", secret);
	formData.set("response", input.token);
	if (input.remoteIp) formData.set("remoteip", input.remoteIp);

	try {
		const res = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body: formData.toString(),
				cache: "no-store",
			},
		);
		if (!res.ok) return false;
		const payload = (await res.json()) as TurnstileVerifyResponse;
		return Boolean(payload.success);
	} catch {
		return false;
	}
}
