import { RAG_CONFIG } from "@/lib/rag/config";

export interface TextChunk {
  index: number;
  text: string;
}

// Regex за разпознаване на заглавия и секции в български нормативни актове и документи
const HEADER_REGEX = /^(?:Чл\.|Член|Раздел|Глава|§|Параграф|Приложение|ДОПЪЛНИТЕЛНИ РАЗПОРЕДБИ|ПРЕХОДНИ И ЗАКЛЮЧИТЕЛНИ РАЗПОРЕДБИ)[\s\dIVXLC]+\.?/mi;

/**
 * Разбива дълъг текст на семантично смислени парчета.
 * Модернизиран алгоритъм:
 *   1. Разделяне по семантични граници (заглавия на глави, членове, раздели).
 *   2. Ако семантичен блок е твърде голям, разделяне по двойни нови редове (абзаци).
 *   3. Ако абзац е твърде голям, разделяне по изречения.
 *   4. Натрупване до `chunkSize`.
 *   5. Между chunks се добавя `chunkOverlap` символи припокриване.
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

  // 1. Първично разделяне по семантични граници (headers)
  // Използваме lookahead, за да запазим самия header в началото на блока
  const semanticBlocks = text.split(new RegExp(`(?=${HEADER_REGEX.source})`, "mi"))
    .map(b => b.trim())
    .filter(Boolean);

  const pieces: string[] = [];

  // 2. Обработка на всеки семантичен блок
  for (const block of semanticBlocks) {
    if (block.length <= chunkSize) {
      pieces.push(block);
      continue;
    }

    // Ако блокът е прекалено голям, разбиваме на абзаци
    const paragraphs = block.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    
    for (const p of paragraphs) {
      if (p.length <= chunkSize) {
        pieces.push(p);
        continue;
      }
      
      // Ако абзацът е прекалено голям, разбиваме на изречения
      const sentences = p.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
      let buf = "";
      for (const s of sentences) {
        if (s.length > chunkSize) {
          if (buf) {
            pieces.push(buf);
            buf = "";
          }
          // Fallback: стриктно разбиване на символи, ако дори изречението е гигантско
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
  }

  // 3. Сливане на малки pieces до достигане на chunkSize
  const merged: string[] = [];
  let current = "";
  
  for (const piece of pieces) {
    // Проверка дали piece започва с header
    const isHeader = HEADER_REGEX.test(piece);
    
    // Ако добавянето на piece ще надвиши лимита ИЛИ ако piece е ново важно заглавие (и current вече има достатъчно текст)
    if ((current + "\n\n" + piece).length > chunkSize || (isHeader && current.length > chunkSize * 0.5)) {
      if (current) merged.push(current);
      current = piece;
    } else {
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) merged.push(current);

  // 4. Добавяне на припокриване (overlap)
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
