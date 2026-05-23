/**
 * AI „лидер“ за чат: единна последователност между звената за знание
 * (RAG → статична ДФЗ база → learned от Supabase → Furrow snapshot),
 * за да не се дублира логиката в API route-ове и да е ясна автоматизацията.
 */

import { getKnowledgeContext } from "@/lib/knowledge/dfz-knowledge";
import { getLearnedKnowledgeContext } from "@/lib/knowledge/learned-knowledge";
import { getFurrowMarketsData } from "@/lib/knowledge/furrow-markets";
import { getRagContext } from "@/lib/rag/hybrid-search";
import { isRagEnabled } from "@/lib/rag/config";

export type ChatRetrievalMode = "rag_hybrid" | "bm25" | "none";

export interface ChatKnowledgePipelineResult {
  /** Обединен контекст за system prompt (празни части са премахнати). */
  combinedKnowledgeContext: string;
  retrievalMode: ChatRetrievalMode;
  retrievedCount: number;
}

/**
 * Събира контекста за чат по фиксиран ред на приоритет за retrieval:
 * 1) RAG (hybrid vector + lexical), при грешка/празно →
 * 2) lexical върху статичната ДФЗ база (`getKnowledgeContext`),
 * 3) learned таблица (async),
 * 4) локален Furrow JSON snapshot.
 */
export async function runChatKnowledgePipeline(
  userQuery: string,
): Promise<ChatKnowledgePipelineResult> {
  let knowledgeContext = "";
  let retrievalMode: ChatRetrievalMode = "none";
  let retrievedCount = 0;

  if (isRagEnabled()) {
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
