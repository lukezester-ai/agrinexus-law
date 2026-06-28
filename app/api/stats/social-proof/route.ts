import { getLiveIntelligenceStats } from "@/lib/live-intelligence-stats";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SocialProofItem = {
	quote: string;
	context: string;
};

const CHARACTER_LABEL: Record<string, string> = {
	elena: "Право · ДФЗ",
	boris: "Поле · култури",
	viktoria: "Финанси · субсидии",
};

function trimQuote(text: string, max = 160): string {
	const one = text.replace(/\s+/g, " ").trim();
	if (one.length <= max) return one;
	return `${one.slice(0, max - 1).trim()}…`;
}

/** Реални положителни въпроси от chat_logs (feedback=1) или фактически capability cards. */
export async function GET() {
	const supabase = getSupabaseAdmin();
	const items: SocialProofItem[] = [];

	if (supabase) {
		const rows = await supabase
			.from("chat_logs")
			.select("user_message, character_id")
			.eq("feedback", 1)
			.order("created_at", { ascending: false })
			.limit(5);

		if (!rows.error && rows.data?.length) {
			for (const row of rows.data) {
				const msg = String(row.user_message ?? "").trim();
				if (msg.length < 12) continue;
				const char = String(row.character_id ?? "");
				items.push({
					quote: trimQuote(msg),
					context: CHARACTER_LABEL[char] ?? "AI асистент",
				});
				if (items.length >= 3) break;
			}
		}
	}

	if (items.length === 0) {
		const live = await getLiveIntelligenceStats();
		const docTile = live.tiles.find((t) => t.label.includes("документ"));
		const chatTile = live.tiles[0];
		items.push(
			{
				quote: "Търся субсидии, срокове и наредби на едно място — с източник към официален документ.",
				context: "Типичен казус · търсене",
			},
			{
				quote: docTile
					? `В архива вече има ${docTile.value} ${docTile.label} от ДФЗ, МЗХ и ingest pipeline.`
					: "Архивът се попълва автоматично от Document Archive Agent.",
				context: "Държавен архив",
			},
			{
				quote: chatTile
					? `Платформата е обработила ${chatTile.value} ${chatTile.label} — RAG + три AI специалиста.`
					: "AI чат с Елена, Борис и Виктория върху нормативна база.",
				context: "Live данни",
			},
		);
	}

	return Response.json({ ok: true, items: items.slice(0, 3) });
}
