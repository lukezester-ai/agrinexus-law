/** Лек smoke endpoint за CI / мониторинг (без външни услуги). */
export function GET() {
	return Response.json({ ok: true, service: "agrinexus-mvp" });
}
