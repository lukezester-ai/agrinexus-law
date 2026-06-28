import { analyzeAgriculturalDocument, isReviewMode } from "@/modules/law/document-review";
import {
	checkRateLimit,
	documentReviewRateLimit,
	extractClientIp,
} from "@/lib/utils/rate-limit";
import { getSessionUser } from "@/lib/billing/auth";
import {
	assertDocumentReviewAllowed,
	buildBillingContext,
	recordDocumentReviewUsage,
	upgradeMessageForDocumentReview,
} from "@/lib/billing/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
	try {
		const ip = extractClientIp(req);
		const rateLimitResult = await checkRateLimit(documentReviewRateLimit, ip);
		if (!rateLimitResult.success) {
			return Response.json(
				{ error: "Твърде много заявки за преглед. Изчакай малко и опитай пак." },
				{ status: 429 },
			);
		}

		const sessionUser = await getSessionUser();
		const billingCtx = await buildBillingContext(
			sessionUser?.id,
			sessionUser?.email,
			ip,
		);
		const reviewUsage = await assertDocumentReviewAllowed(billingCtx);
		if (!reviewUsage.allowed) {
			return Response.json(
				{
					error: upgradeMessageForDocumentReview(billingCtx),
					code: "PLAN_LIMIT",
					requiresAuth: reviewUsage.requiresAuth,
					plan: billingCtx.planId,
					usage: reviewUsage,
					upgradeUrl: "/ceni",
				},
				{ status: reviewUsage.requiresAuth ? 401 : 402 },
			);
		}

		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const modeValue = formData.get("mode");
		const context = String(formData.get("context") || "").trim();

		if (!file) {
			return Response.json({ error: "Липсва документ за анализ." }, { status: 400 });
		}
		if (file.size > MAX_FILE_BYTES) {
			return Response.json(
				{ error: `Файлът надвишава ${MAX_FILE_BYTES / (1024 * 1024)} MB.` },
				{ status: 400 },
			);
		}
		if (!isReviewMode(modeValue)) {
			return Response.json({ error: "Невалиден режим за анализ." }, { status: 400 });
		}

		const result = await analyzeAgriculturalDocument({ file, mode: modeValue, context });
		await recordDocumentReviewUsage(billingCtx);
		return Response.json({ ok: true, ...result });
	} catch (error) {
		console.error("[document-review/analyze]", error);
		const message = error instanceof Error ? error.message : "Неуспешен анализ на документа.";
		const status = /OPENAI_API_KEY/.test(message) ? 503 : 500;
		return Response.json({ error: message }, { status });
	}
}
