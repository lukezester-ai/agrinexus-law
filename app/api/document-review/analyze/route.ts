import { analyzeAgriculturalDocument, isReviewMode } from "@/modules/law/document-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const modeValue = formData.get("mode");
		const context = String(formData.get("context") || "").trim();

		if (!file) {
			return Response.json({ error: "Липсва документ за анализ." }, { status: 400 });
		}
		if (!isReviewMode(modeValue)) {
			return Response.json({ error: "Невалиден режим за анализ." }, { status: 400 });
		}

		const result = await analyzeAgriculturalDocument({ file, mode: modeValue, context });
		return Response.json({ ok: true, ...result });
	} catch (error) {
		console.error("[document-review/analyze]", error);
		const message = error instanceof Error ? error.message : "Неуспешен анализ на документа.";
		const status = /OPENAI_API_KEY/.test(message) ? 503 : 500;
		return Response.json({ error: message }, { status });
	}
}