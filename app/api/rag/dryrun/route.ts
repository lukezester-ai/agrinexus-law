/**
 * Dry-run на RAG индексирането.
 * Чете статичната KNOWLEDGE_BASE, нарязва я на chunks и връща статистика
 * БЕЗ да извиква OpenAI и БЕЗ да пише в Supabase.
 *
 * Използване: GET /api/rag/dryrun (защитен с INGEST_ADMIN_TOKEN).
 */

import { KNOWLEDGE_BASE } from "@/lib/knowledge/dfz-knowledge";
import { chunkText } from "@/lib/rag/chunker";
import { RAG_CONFIG } from "@/lib/rag/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const required = process.env.INGEST_ADMIN_TOKEN?.trim();
  if (!required) return false;
  const token =
    req.headers.get("x-ingest-token")?.trim() ||
    req.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  return Boolean(token && token === required);
}

interface DocStats {
  id: string;
  title: string;
  category: string;
  contentChars: number;
  chunks: number;
  chunkSizes: number[];
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perDoc: DocStats[] = [];
  let totalChunks = 0;
  let totalChars = 0;
  let maxChunkSize = 0;
  let minChunkSize = Number.POSITIVE_INFINITY;

  for (const doc of KNOWLEDGE_BASE) {
    const chunks = chunkText(doc.content);
    const sizes = chunks.map((c) => c.text.length);
    const docChars = doc.content.length;

    totalChunks += chunks.length;
    totalChars += docChars;
    if (sizes.length > 0) {
      maxChunkSize = Math.max(maxChunkSize, ...sizes);
      minChunkSize = Math.min(minChunkSize, ...sizes);
    }

    perDoc.push({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      contentChars: docChars,
      chunks: chunks.length,
      chunkSizes: sizes,
    });
  }

  const avgChunkSize =
    totalChunks > 0
      ? Math.round(perDoc.reduce((s, d) => s + d.chunkSizes.reduce((x, y) => x + y, 0), 0) / totalChunks)
      : 0;

  // Прогнозна цена за text-embedding-3-small ($0.02 / 1M tokens)
  // Грубо приближение: 1 token ≈ 3 символа за български текст.
  const estTokens = Math.round(totalChars / 3);
  const estCostUsd = (estTokens / 1_000_000) * 0.02;

  return Response.json({
    config: {
      model: RAG_CONFIG.embeddingModel,
      chunkSize: RAG_CONFIG.chunkSize,
      chunkOverlap: RAG_CONFIG.chunkOverlap,
      embeddingDimensions: RAG_CONFIG.embeddingDimensions,
    },
    summary: {
      documents: KNOWLEDGE_BASE.length,
      totalChunks,
      totalChars,
      avgChunkSize,
      minChunkSize: minChunkSize === Number.POSITIVE_INFINITY ? 0 : minChunkSize,
      maxChunkSize,
      estimatedTokens: estTokens,
      estimatedEmbeddingCostUsd: Number(estCostUsd.toFixed(4)),
    },
    perDoc: perDoc
      .sort((a, b) => b.chunks - a.chunks)
      .map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        contentChars: d.contentChars,
        chunks: d.chunks,
      })),
  });
}
