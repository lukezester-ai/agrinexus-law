import OpenAI from "openai";
import { CHARACTERS, type CharacterId, buildSystemPrompt } from "@/lib/characters";
import { tryInternalCharacterReply } from "@/lib/chat-internal";
import { farmProfileToPromptText } from "@/lib/farm-profile-server";
import { resolveFarmProfileForChat } from "@/lib/farm-profile-resolve";
import { getKnowledgeContext } from "@/lib/knowledge/dfz-knowledge";
import { chatRateLimit, checkRateLimit, extractClientIp } from "@/lib/utils/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeChatMessages } from "@/lib/anthropic-messages";
import { getLearnedKnowledgeContext } from "@/lib/knowledge/learned-knowledge";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
	try {
		const ip = extractClientIp(req);
		const rateLimitResult = await checkRateLimit(chatRateLimit, ip);

		if (!rateLimitResult.success) {
			return Response.json({ error: "Твърде много заявки. Изчакай малко и опитай пак." }, { status: 429 });
		}

		const { messages, characterId, userProfile } = await req.json();

		const { profile: resolvedFarmProfile, source: farmProfileSource } =
			await resolveFarmProfileForChat(userProfile);

		const character = CHARACTERS[characterId as CharacterId];
		if (!character) {
			return Response.json({ error: "Невалиден персонаж" }, { status: 400 });
		}

		const normalized = normalizeChatMessages(messages ?? []);
		if (normalized.length === 0) {
			return Response.json({ error: "Няма съобщение за обработка." }, { status: 400 });
		}

		const lastMessage = normalized[normalized.length - 1];
		const userQuery = lastMessage?.role === "user" ? lastMessage.content : "";

		const internalAttempt = tryInternalCharacterReply(
			characterId as CharacterId,
			normalized,
		);

		let responseText: string;
		let replySource: "internal_kb" | "openai" = "openai";
		let model: string | undefined;
    let chatLogId: string | null = null;

		if (!internalAttempt.useOpenAI) {
			responseText = internalAttempt.reply;
			replySource = "internal_kb";
		} else {
			const apiKey = process.env.OPENAI_API_KEY?.trim();
			const isPlaceholderKey =
				!apiKey ||
				/PASTE_OPENAI_KEY_HERE/i.test(apiKey) ||
				/^your[_-]?openai[_-]?key$/i.test(apiKey);
			if (isPlaceholderKey) {
				return Response.json(
					{
						error:
							"OPENAI_API_KEY липсва или е примерна стойност. Сложете реален ключ от platform.openai.com в `.env.local`.",
					},
					{ status: 503 },
				);
			}

			const knowledgeContext = getKnowledgeContext(userQuery);
      const learnedKnowledgeContext = await getLearnedKnowledgeContext(userQuery);
      const combinedKnowledgeContext = [knowledgeContext, learnedKnowledgeContext].filter(Boolean).join("\n\n");

			const profileText = resolvedFarmProfile
				? farmProfileToPromptText(resolvedFarmProfile)
				: undefined;

			const systemPrompt = buildSystemPrompt(character, combinedKnowledgeContext, profileText);
			model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

			const openai = new OpenAI({ apiKey });

			const response = await openai.chat.completions.create({
				model,
				max_tokens: 1024,
				messages: [
					{ role: "system", content: systemPrompt },
					...normalized,
				],
			});

			responseText =
				response.choices[0]?.message?.content?.trim() ||
				"Извинявай, не успях да отговоря. Опитай пак.";
		}

		const supabaseAdmin = getSupabaseAdmin();
		if (supabaseAdmin) {
			try {
				const inserted = await supabaseAdmin.from("chat_logs").insert({
					character_id: characterId,
					user_message: userQuery,
					assistant_message: responseText,
					ip_address: ip,
					user_profile: resolvedFarmProfile
						? { ...resolvedFarmProfile, _source: farmProfileSource }
						: null,
				}).select("id").single();
        chatLogId = (inserted.data?.id as string | undefined) ?? null;
			} catch (err) {
				console.error("Failed to log chat:", err);
			}
		}

		return Response.json({
			response: responseText,
			character: characterId,
			remaining: rateLimitResult.remaining,
			model: model ?? "internal-knowledge-base",
			replySource,
      chatLogId,
		});
	} catch (error) {
		console.error("Chat API error:", error);
		const msg = error instanceof Error ? error.message : String(error);
		const hint =
			msg.includes("model") || msg.includes("404")
				? " Проверете OPENAI_MODEL в `.env.local` (напр. gpt-4o-mini)."
				: msg.includes("401") || msg.toLowerCase().includes("authentication")
					? " Проверете дали OPENAI_API_KEY е валиден (не примерен) и рестартирайте `npm run dev`."
				: "";
		return Response.json({ error: `Възникна грешка при AI заявката.${hint}` }, { status: 502 });
	}
}
