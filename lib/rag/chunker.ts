import { RAG_CONFIG } from "@/lib/rag/config";

export interface TextChunk {
  index: number;
  text: string;
}

/**
 * Разбива дълъг текст на семантично смислени парчета.
 * Алгоритъм:
 *   1. Разделяне по двойни нови редове (абзаци).
 *   2. Натрупване на абзаци, докато не достигнем `chunkSize`.
 *   3. Ако един абзац е по-голям от `chunkSize` → разбива се по изречения.
 *   4. Между chunks се добавя `chunkOverlap` символи припокриване от края на предишния.
 */
export function chunkText(
  raw: string,
  opts?: { chunkSize?: number; chunkOverlap?: number },
): TextChunk[] {
  const chunkSize = opts?.chunkSize ?? RAG_CONFIG.chunkSize;
  const overlap = opts?.chunkOverlap ?? RAG_CONFIG.chunkOverlap;

  const text = (raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  if (text.length <= chunkSize) return [{ index: 0, text }];

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pieces: string[] = [];

  for (const p of paragraphs) {
    if (p.length <= chunkSize) {
      pieces.push(p);
      continue;
    }
    const sentences = p.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
    let buf = "";
    for (const s of sentences) {
      if (s.length > chunkSize) {
        if (buf) {
          pieces.push(buf);
          buf = "";
        }
        for (let i = 0; i < s.length; i += chunkSize) {
          pieces.push(s.slice(i, i + chunkSize));
        }
        continue;
      }
      if ((buf + " " + s).trim().length > chunkSize) {
        if (buf) pieces.push(buf);
        buf = s;
      } else {
        buf = buf ? `${buf} ${s}` : s;
      }
    }
    if (buf) pieces.push(buf);
  }

  const merged: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if ((current + "\n\n" + piece).length > chunkSize) {
      if (current) merged.push(current);
      current = piece;
    } else {
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) merged.push(current);

  if (overlap <= 0 || merged.length <= 1) {
    return merged.map((text, index) => ({ index, text }));
  }

  const withOverlap: string[] = [];
  for (let i = 0; i < merged.length; i++) {
    if (i === 0) {
      withOverlap.push(merged[i]);
    } else {
      const prev = merged[i - 1];
      const tail = prev.slice(Math.max(0, prev.length - overlap));
      withOverlap.push(`${tail}\n${merged[i]}`);
    }
  }
  return withOverlap.map((text, index) => ({ index, text }));
}

/** Детерминистичен SHA-256 на низ — за content_hash в knowledge_chunks. */
export async function sha256(input: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(input).digest("hex");
}
