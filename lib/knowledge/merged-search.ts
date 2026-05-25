/**
 * Обединява външно лексикално търсене (Typesense / Meilisearch) с вътрешно BM25 за ДФЗ базата.
 */
import type { KnowledgeDoc } from "@/lib/knowledge/dfz-knowledge";
import { KNOWLEDGE_BASE } from "@/lib/knowledge/dfz-knowledge";
import { internalKnowledgeSearch } from "@/lib/knowledge/internal-ai-search";

/** Намерение: субсидии / норми / срокове — леко покачване на съответните типове. */
function dfzIntentBoost(doc: KnowledgeDoc, queryNorm: string): number {
	let b = 0;
	const t = `${doc.title} ${doc.content} ${doc.category}`.toLowerCase();
	if (
		/(срок|краен|кампания|март|май|юни|подаване)/i.test(queryNorm) &&
		(doc.type === "deadline" || /срок/i.test(doc.title))
	) {
		b += 2.5;
	}
	if (
		/(наредб|закон|регламент|условност|gaec|smr)/i.test(queryNorm) &&
		doc.type === "regulation"
	) {
		b += 2;
	}
	if (
		/(субсид|плащан|подпомаган|директн|бисс|пндп|осп)/i.test(queryNorm) &&
		(doc.type === "scheme" || /плащан/i.test(doc.category))
	) {
		b += 1.8;
	}
	if (/(процедур|исак|кеп|пик|обжалван|жалба)/i.test(queryNorm) && doc.type === "procedure") {
		b += 1.8;
	}
	if (/(дфз|dfz)/i.test(queryNorm) && /дфз|dfz/i.test(t)) {
		b += 1;
	}
	return b;
}

export function mergeKnowledgeSearchResults(
	query: string,
	externalLexicalHits: KnowledgeDoc[],
): KnowledgeDoc[] {
	const { results: internalRanked, scores } = internalKnowledgeSearch(
		query,
		KNOWLEDGE_BASE,
		{ limit: 16 },
	);
	const scoreById = new Map<string, number>();
	internalRanked.forEach((d, i) => {
		const base = scores[i] ?? 0;
		scoreById.set(d.id, base + dfzIntentBoost(d, query));
	});

	const mergedIds = new Set<string>();
	const merged: KnowledgeDoc[] = [];

	for (const d of externalLexicalHits) {
		if (!mergedIds.has(d.id)) {
			merged.push(d);
			mergedIds.add(d.id);
			if (!scoreById.has(d.id)) {
				scoreById.set(d.id, 0.5 + dfzIntentBoost(d, query));
			}
		}
	}
	for (const d of internalRanked) {
		if (!mergedIds.has(d.id)) {
			merged.push(d);
			mergedIds.add(d.id);
		}
	}

	merged.sort((a, b) => (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0));

	return merged.slice(0, 12);
}
