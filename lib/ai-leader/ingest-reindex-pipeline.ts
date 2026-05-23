/**
 * AI лидер за индексиране: един вход за document ingest, web discover и RAG reindex,
 * за да са подравнени звената и API route-овете останат тънки.
 */

import { runDocumentIngest } from "@/lib/ingest/run";
import { runWebAgricultureDocumentIngest } from "@/lib/ingest/web-agri-discover";
import type { IngestResult } from "@/lib/ingest/types";
import {
  reindexAll,
  reindexLearned,
  reindexPublicDocumentContent,
  reindexPublicDocuments,
  reindexStatic,
  type ReindexStats,
} from "@/lib/rag/reindex";

// --- Ingest (локални / уеб източници) ---

export type IngestRunBody = {
  mode?: string;
  topic?: string;
  sourceName?: string;
  limitPerSource?: number;
  searchNum?: number;
  maxDownloads?: number;
};

export type IngestRunResult =
  | { ok: true; mode: "web"; results: IngestResult[] }
  | { ok: true; mode: "documents"; results: IngestResult[] };

export async function runIngestOrchestration(body: IngestRunBody): Promise<IngestRunResult> {
  if (body.mode === "web") {
    const topic =
      typeof body.topic === "string" && body.topic.trim()
        ? body.topic.trim()
        : "земеделие субсидии ОСП CAP ПСРР България";
    const one = await runWebAgricultureDocumentIngest({
      topic,
      searchNum: typeof body.searchNum === "number" ? body.searchNum : undefined,
      maxDownloads: typeof body.maxDownloads === "number" ? body.maxDownloads : undefined,
    });
    return { ok: true, results: [one], mode: "web" };
  }

  const results = await runDocumentIngest({
    sourceName: body.sourceName,
    limitPerSource: body.limitPerSource,
  });
  return { ok: true, results, mode: "documents" };
}

// --- RAG reindex ---

export type ReindexTarget =
  | "all"
  | "static"
  | "learned"
  | "public_documents"
  | "public_doc_content";

export function parseReindexTarget(value: unknown): ReindexTarget {
  if (
    value === "all" ||
    value === "static" ||
    value === "learned" ||
    value === "public_documents" ||
    value === "public_doc_content"
  ) {
    return value;
  }
  return "all";
}

export type ReindexOrchestrationOptions = {
  limit?: number;
  onlySourceIds?: string[];
};

export async function runReindexOrchestration(
  target: ReindexTarget,
  opts: ReindexOrchestrationOptions = {},
): Promise<{ target: ReindexTarget; results: ReindexStats[] }> {
  let results: ReindexStats[] = [];
  switch (target) {
    case "static":
      results = [await reindexStatic()];
      break;
    case "learned":
      results = [await reindexLearned()];
      break;
    case "public_documents":
      results = [await reindexPublicDocuments()];
      break;
    case "public_doc_content":
      results = [
        await reindexPublicDocumentContent({
          limit: typeof opts.limit === "number" ? opts.limit : undefined,
          onlySourceIds: Array.isArray(opts.onlySourceIds) ? opts.onlySourceIds : undefined,
        }),
      ];
      break;
    case "all":
    default:
      results = await reindexAll();
      break;
  }
  return { target, results };
}

/** Метаданни за GET `/api/rag/reindex` (usage) — един източник на истина. */
export function getReindexOrchestrationUsageDocs() {
  return {
    method: "POST" as const,
    headers: { "x-ingest-token": "<INGEST_ADMIN_TOKEN>" },
    body: {
      target:
        "all | static | learned | public_documents | public_doc_content",
      limit: "number (optional, за public_doc_content)",
      onlySourceIds: "string[] (optional, id-та от public_documents)",
    },
  };
}
