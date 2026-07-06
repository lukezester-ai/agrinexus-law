/**
 * AI „лидер“ за чат: единна последователност между звената за знание
 * (MCP → RAG → статична ДФЗ база → learned от Supabase → Furrow snapshot),
 * за да не се дублира логиката в API route-ове и да е ясна автоматизацията.
 *
 * При `MCP_ENABLED=1` (локално/самостоятелен хост) използва MCP сървъра
 * като първи източник. На Vercel(child_process не е наличен) пада към
 * директни извиквания (getRagContext).
 */

import { getKnowledgeContext } from "@/lib/knowledge/dfz-knowledge";
import { getLearnedKnowledgeContext } from "@/lib/knowledge/learned-knowledge";
import { getFurrowMarketsData } from "@/lib/knowledge/furrow-markets";
import { getRagContext } from "@/lib/rag/hybrid-search";
import { isRagEnabled } from "@/lib/rag/config";
import { getMcpRagContext } from "@/lib/mcp-client";

export type ChatRetrievalMode = "rag_hybrid" | "bm25" | "mcp" | "none";

export interface ChatKnowledgePipelineResult {
  combinedKnowledgeContext: string;
  retrievalMode: ChatRetrievalMode;
  retrievedCount: number;
}

const mcpEnabled = (): boolean =>
  process.env.MCP_ENABLED === "1" &&
  !process.env.VERCEL;

export async function runChatKnowledgePipeline(
  userQuery: string,
): Promise<ChatKnowledgePipelineResult> {
  let knowledgeContext = "";
  let retrievalMode: ChatRetrievalMode = "none";
  let retrievedCount = 0;

  if (mcpEnabled()) {
    try {
      const mcp = await getMcpRagContext(userQuery);
      if (mcp.context) {
        knowledgeContext = mcp.context;
        retrievedCount = mcp.items;
        retrievalMode = "mcp";
      }
    } catch (mcpErr) {
      console.error("MCP retrieval failed, falling back to RAG:", mcpErr);
    }
  }

  if (!knowledgeContext && isRagEnabled()) {
    try {
      const rag = await getRagContext(userQuery);
      knowledgeContext = rag.context;
      retrievedCount = rag.items.length;
      retrievalMode = rag.usedVector ? "rag_hybrid" : "bm25";
    } catch (ragErr) {
      console.error("RAG retrieval failed, falling back to BM25:", ragErr);
    }
  }

  if (!knowledgeContext) {
    knowledgeContext = getKnowledgeContext(userQuery);
    retrievalMode = knowledgeContext ? "bm25" : "none";
  }

  const learnedKnowledgeContext = await getLearnedKnowledgeContext(userQuery);
  const furrowContext = getFurrowMarketsData();
  const combinedKnowledgeContext = [
    knowledgeContext,
    learnedKnowledgeContext,
    furrowContext,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    combinedKnowledgeContext,
    retrievalMode,
    retrievedCount,
  };
}
