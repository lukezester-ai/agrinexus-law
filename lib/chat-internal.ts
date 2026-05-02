/**
 * Първи ходове на разговора: отговор от вътрешната база знания с глас на персонажа.
 * При продължил диалог или при искане за подробност → прехвърляне към външен LLM (API route).
 */
import type { CharacterId } from "@/lib/characters";
import { KNOWLEDGE_BASE } from "@/lib/knowledge/dfz-knowledge";
import {
	extractKnowledgeSummary,
	internalKnowledgeSearch,
} from "@/lib/knowledge/internal-ai-search";

export type NormalizedChatMessage = { role: "user" | "assistant"; content: string };

const FORCE_EXTERNAL =
	/подробно|подробен|разширен|детайл|стъпка\s*по\s*стъпка|обясни\s+ми\s+цялата|напиши\s+есе/i;

/** След толкова потребителски съобщения отиваме директно към външен AI. */
export const INTERNAL_REPLY_MAX_USER_TURNS = 2;

/** Минимална дължина на въпроса за опит за вътрешен отговор. */
const MIN_USER_LEN_FOR_INTERNAL = 12;

function roleIntro(id: CharacterId): string {
	switch (id) {
		case "elena":
			return "Елена съм — гледам правото и процедурите около ДФЗ.";
		case "boris":
			return "Борис съм — отговарям през призмата на полето и практиката.";
		case "viktoria":
			return "Виктория съм — подреждам информацията около подкрепа и числа.";
		default:
			return "";
	}
}

function wrapReply(
	characterId: CharacterId,
	summary: string,
	topTitle: string,
): string {
	const intro = roleIntro(characterId);
	return `${intro}

На база на вътрешната ни база за ДФЗ и ОСП (ориентационно, не е официален текст):

${summary}

Основен запис: „${topTitle}“.

За индивидуален случай винаги провери актуалните указания на ДФЗ (dfz.bg) и при нужда адвокат или счетоводител. Ако искаш по-разширен разговор по случая — продължавам с по-подробен анализ в следващото съобщение.`;
}

export type InternalTryResult =
	| { useOpenAI: true }
	| { useOpenAI: false; reply: string };

export function tryInternalCharacterReply(
	characterId: CharacterId,
	normalizedMessages: NormalizedChatMessage[],
): InternalTryResult {
	const userMsgs = normalizedMessages.filter((m) => m.role === "user");
	const userTurns = userMsgs.length;

	if (userTurns > INTERNAL_REPLY_MAX_USER_TURNS) {
		return { useOpenAI: true };
	}

	const lastUser = [...normalizedMessages].reverse().find((m) => m.role === "user");
	const q = lastUser?.content?.trim() ?? "";
	if (q.length < MIN_USER_LEN_FOR_INTERNAL) {
		return { useOpenAI: true };
	}
	if (FORCE_EXTERNAL.test(q)) {
		return { useOpenAI: true };
	}

	const { results, scores } = internalKnowledgeSearch(q, KNOWLEDGE_BASE, {
		limit: 6,
	});
	if (results.length === 0 || !scores.length || scores[0] <= 0) {
		return { useOpenAI: true };
	}

	const summary = extractKnowledgeSummary(q, results);
	if (!summary || summary.length < 40) {
		return { useOpenAI: true };
	}

	return {
		useOpenAI: false,
		reply: wrapReply(characterId, summary, results[0].title),
	};
}
