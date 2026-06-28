import { runArchiveAgentAdapter, ARCHIVE_AGENT_ID } from "@/lib/ai-leader/agents/archive-agent-adapter";
import { runHealthGuardAgent, HEALTH_GUARD_AGENT_ID } from "@/lib/ai-leader/agents/health-guard-agent";
import {
	runKnowledgeLearnerAgent,
	KNOWLEDGE_LEARNER_AGENT_ID,
} from "@/lib/ai-leader/agents/knowledge-learner-agent";
import { runIndexQualityAgent, INDEX_QUALITY_AGENT_ID } from "@/lib/ai-leader/agents/index-quality-agent";
import {
	runFarmerInsightsAgent,
	FARMER_INSIGHTS_AGENT_ID,
} from "@/lib/ai-leader/agents/farmer-insights-agent";
import type { AgentDefinition, AgentId } from "@/lib/ai-leader/agents/types";

export const AGENT_REGISTRY: AgentDefinition[] = [
	{
		id: ARCHIVE_AGENT_ID,
		name: "Archive Agent",
		nameBg: "Архивар",
		description: "Изтегля, архивира и индексира държавни PDF документи.",
		role: "Създава и попълва архива (ДФЗ/МЗХ → Supabase → RAG → Meili).",
		run: runArchiveAgentAdapter,
	},
	{
		id: HEALTH_GUARD_AGENT_ID,
		name: "Health Guard",
		nameBg: "Пазител",
		description: "Проверява env, RAG, Supabase и billing конфигурация.",
		role: "Проверява здравето на системата и предлага fix-ове.",
		run: runHealthGuardAgent,
	},
	{
		id: KNOWLEDGE_LEARNER_AGENT_ID,
		name: "Knowledge Learner",
		nameBg: "Учен",
		description: "Превръща положителен chat feedback в learned knowledge.",
		role: "Самообучение от 👍 отговори в чата → knowledge_learned_items.",
		run: runKnowledgeLearnerAgent,
	},
	{
		id: INDEX_QUALITY_AGENT_ID,
		name: "Index Quality",
		nameBg: "Индексатор",
		description: "Попълва липсващи embeddings и sync-ва Meili.",
		role: "Подобрява RAG индекса и търсенето след archive/learner.",
		run: runIndexQualityAgent,
	},
	{
		id: FARMER_INSIGHTS_AGENT_ID,
		name: "Farmer Insights",
		nameBg: "Аналитик",
		description: "Събира engagement метрики и препоръки за продукта.",
		role: "Анализира ползване и предлага какво да се подобри на landing.",
		run: runFarmerInsightsAgent,
	},
];

const byId = new Map<AgentId, AgentDefinition>(AGENT_REGISTRY.map((a) => [a.id, a]));

export function getAgentDefinition(id: AgentId): AgentDefinition | undefined {
	return byId.get(id);
}

export function parseAgentIds(raw: string | null | undefined): AgentId[] {
	if (!raw?.trim()) return AGENT_REGISTRY.map((a) => a.id);
	const valid = new Set<AgentId>(AGENT_REGISTRY.map((a) => a.id));
	return raw
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter((s): s is AgentId => valid.has(s as AgentId));
}

export const DEFAULT_AGENT_ORDER: AgentId[] = [
	HEALTH_GUARD_AGENT_ID,
	ARCHIVE_AGENT_ID,
	KNOWLEDGE_LEARNER_AGENT_ID,
	INDEX_QUALITY_AGENT_ID,
	FARMER_INSIGHTS_AGENT_ID,
];
