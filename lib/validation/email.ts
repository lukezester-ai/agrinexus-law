const EMAIL_MAX_LENGTH = 254;

/**
 * Pragmatic email validation for user input.
 * We intentionally avoid full RFC parsing because it is overly permissive for real-world delivery.
 */
export function isValidEmail(value: unknown): value is string {
	if (typeof value !== "string") return false;
	const email = value.trim();
	if (!email || email.length > EMAIL_MAX_LENGTH) return false;

	// Require a single @, no spaces, and a conservative domain format.
	return /^[^\s@]+@[^\s@]+\.[A-Za-z0-9-]{2,}$/.test(email);
}

export function normalizeEmail(value: string): string {
	return value.trim().toLowerCase();
}
