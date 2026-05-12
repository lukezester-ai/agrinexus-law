import { getRagContext } from "@/lib/rag/hybrid-search";
import { getKnowledgeContext } from "@/lib/knowledge/dfz-knowledge";
import {
  checkRateLimit,
  extractClientIp,
  statistikiInsightsRateLimit,
} from "@/lib/utils/rate-limit";

function toShortSnippet(text: string): string {
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (!cleaned) return "";
	if (cleaned.length <= 220) return cleaned;
	return `${cleaned.slice(0, 217)}...`;
}

function fallbackBullets(context: string): string[] {
	if (!context.trim()) return [];
	return context
		.split(/\n+/)
		.map((line) => line.trim())
		.filter((line) => line.length > 20 && !line.startsWith("===") && !line.startsWith("Категория:"))
		.slice(0, 4)
		.map(toShortSnippet);
}

export async function POST(req: Request) {
	try {
		const ip = extractClientIp(req);
		const rateLimitResult = await checkRateLimit(statistikiInsightsRateLimit, ip);
		if (!rateLimitResult.success) {
			return Response.json(
				{ error: "Твърде много заявки. Изчакай малко и опитай пак." },
				{ status: 429 },
			);
		}

		const body = (await req.json()) as { query?: string };
		const query = (body.query || "").trim();
		if (!query) {
			return Response.json({ error: "Липсва заявка." }, { status: 400 });
		}

		try {
			const rag = await getRagContext(query);
			if (rag.items.length > 0) {
				const insights = rag.items.slice(0, 4).map((item) => ({
					title: item.title,
					source: item.source_name || item.category || "Agri knowledge",
					snippet: toShortSnippet(item.content),
				}));
				return Response.json({
					ok: true,
					mode: rag.usedVector ? "rag_hybrid" : "bm25",
					insights,
				});
			}
		} catch (err) {
			console.error("Statistiki RAG error, fallback to BM25:", err);
		}

		const fallback = getKnowledgeContext(query);
		const bullets = fallbackBullets(fallback);
		return Response.json({
			ok: true,
			mode: "bm25",
			insights: bullets.map((snippet) => ({
				title: "Релевантен контекст",
				source: "Knowledge base",
				snippet,
			})),
		});
	} catch (error) {
		console.error("Statistiki insights error:", error);
		return Response.json(
			{ error: "Неуспешно извличане на контекст." },
			{ status: 500 },
		);
	}
}
