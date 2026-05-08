import OpenAI from "openai";
import { RAG_CONFIG } from "@/lib/rag/config";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY липсва — embeddings не могат да се генерират.");
  }
  client = new OpenAI({ apiKey });
  return client;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Подготвя текста (тримване, sane upper bound 8k chars). */
function prepareInput(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 8000 ? trimmed.slice(0, 8000) : trimmed;
}

/**
 * Генерира embedding за един текст.
 * Хвърля грешка при липса на ключ или OpenAI failure.
 */
export async function embedText(text: string): Promise<number[]> {
  const input = prepareInput(text);
  if (!input) {
    return new Array(RAG_CONFIG.embeddingDimensions).fill(0);
  }
  const openai = getClient();
  const resp = await openai.embeddings.create({
    model: RAG_CONFIG.embeddingModel,
    input,
  });
  const vec = resp.data[0]?.embedding;
  if (!vec || vec.length !== RAG_CONFIG.embeddingDimensions) {
    throw new Error(
      `Embedding с грешна размерност: ${vec?.length} (очаквано ${RAG_CONFIG.embeddingDimensions})`,
    );
  }
  return vec;
}

/**
 * Batch embeddings — изпраща до OpenAI на групи по `embeddingBatchSize`.
 * Поддържа empty inputs (попълва ги с нулев вектор).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getClient();
  const out: number[][] = new Array(texts.length);
  const prepared = texts.map(prepareInput);

  const indices: number[] = [];
  const inputs: string[] = [];
  for (let i = 0; i < prepared.length; i++) {
    if (!prepared[i]) {
      out[i] = new Array(RAG_CONFIG.embeddingDimensions).fill(0);
    } else {
      indices.push(i);
      inputs.push(prepared[i]);
    }
  }

  const batches = chunkArray(inputs, RAG_CONFIG.embeddingBatchSize);
  let cursor = 0;
  for (const batch of batches) {
    const resp = await openai.embeddings.create({
      model: RAG_CONFIG.embeddingModel,
      input: batch,
    });
    for (let j = 0; j < resp.data.length; j++) {
      const vec = resp.data[j]?.embedding;
      if (!vec) {
        throw new Error("OpenAI върна embedding без `embedding` поле.");
      }
      out[indices[cursor + j]] = vec;
    }
    cursor += resp.data.length;
  }

  return out;
}
