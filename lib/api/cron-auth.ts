import { timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

/** Authorizes scheduled jobs using Vercel/GitHub's Bearer token convention. */
export function isCronAuthorized(req: Request): boolean {
	const required = process.env.CRON_SECRET?.trim();
	if (!required) return false;

	const authorization = req.headers.get("authorization")?.trim() ?? "";
	const supplied = authorization.replace(/^Bearer\s+/i, "");
	return Boolean(supplied) && safeEqual(supplied, required);
}
