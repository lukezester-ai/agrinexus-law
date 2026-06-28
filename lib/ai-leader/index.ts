export {
  runChatKnowledgePipeline,
  type ChatKnowledgePipelineResult,
  type ChatRetrievalMode,
} from "@/lib/ai-leader/chat-knowledge-pipeline";

export { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";

export {
  runIngestOrchestration,
  runReindexOrchestration,
  parseReindexTarget,
  getReindexOrchestrationUsageDocs,
  type IngestRunBody,
  type IngestRunResult,
  type ReindexTarget,
  type ReindexOrchestrationOptions,
} from "@/lib/ai-leader/ingest-reindex-pipeline";

export {
  DOCUMENT_ARCHIVE_AGENT_ID,
  runDocumentArchiveAgent,
  parseDocumentArchiveAgentFromUrl,
  type DocumentArchiveAgentOptions,
  type DocumentArchiveAgentResult,
} from "@/lib/ai-leader/document-archive-agent";

export {
  AGENT_REGISTRY,
  DEFAULT_AGENT_ORDER,
  getAgentDefinition,
  parseAgentIds,
} from "@/lib/ai-leader/agents/registry";

export {
  runAgentById,
  runAgentOrchestrator,
  type RunAgentsOptions,
} from "@/lib/ai-leader/agents/orchestrator";

export {
  getRecentAgentRuns,
  persistAgentRun,
} from "@/lib/ai-leader/agents/agent-run-store";

export type {
  AgentId,
  AgentRunResult,
  AgentDefinition,
  OrchestratorResult,
} from "@/lib/ai-leader/agents/types";
