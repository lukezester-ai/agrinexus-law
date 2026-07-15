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
/**
 * Премахва паразитен шум от суровия текст на документа преди разбиване:
 * номерация на страници (стр. 4 от 120), пунктирани линии (.........), копирайт и менюта.
 */
function cleanNoiseBeforeChunking(raw: string): string {
  return (raw || "")
    .replace(/\r\n/g, "\n")
    // Премахване на номера на страници (напр. Стр. 12 / Страница 4 от 50 / Page 3)
    .replace(/^(?:стр\.|страница|page)\s*\d+(?:\s*(?:\/|от|of)\s*\d+)?\s*$/gim, "")
    // Премахване на дълги пунктирани линии или подзаглавни разделители от съдържания
    .replace(/^[.\-_~=]{5,}$/gm, "")
    // Премахване на самотни цифри на нов ред (често остатъчни номерации в PDF)
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Проверява дали парчето текст съдържа достатъчна семантична плътност или таблични данни.
 * Предотвратява задръстване на RAG и разход на токени с празни/боклучави чанкове.
 */
function isHighDensityChunk(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 35) return false;
  // Ако съдържа Markdown таблица (| --- | или цифри/данни), задължително го запазваме
  if (trimmed.includes("|") && trimmed.includes("\n|")) return true;
  // Проверка за съдържателност (поне 4 реални думи с дължина над 3 символа)
  const words = trimmed.split(/\s+/).filter((w) => w.length >= 3);
  return words.length >= 4;
}

export function chunkText(
  raw: string,
  opts?: { chunkSize?: number; chunkOverlap?: number },
): TextChunk[] {
  const chunkSize = opts?.chunkSize ?? RAG_CONFIG.chunkSize;
  const overlap = opts?.chunkOverlap ?? RAG_CONFIG.chunkOverlap;

  const text = cleanNoiseBeforeChunking(raw);
  if (!text) return [];
  if (text.length <= chunkSize) return [{ index: 0, text }];

  // 1. Първично разделяне по семантични граници (headers)
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

    // Ако блокът е прекалено голям, разбиваме на абзаци, но пазим таблиците цели
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
    const isHeader = HEADER_REGEX.test(piece);
    if ((current + "\n\n" + piece).length > chunkSize || (isHeader && current.length > chunkSize * 0.5)) {
      if (current) merged.push(current);
      current = piece;
    } else {
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) merged.push(current);

  // Филтриране на боклучави/празни чанкове с ниска плътност
  const denseMerged = merged.filter(isHighDensityChunk);
  const targetChunks = denseMerged.length > 0 ? denseMerged : merged;

  // 4. Добавяне на припокриване (overlap)
  if (overlap <= 0 || targetChunks.length <= 1) {
    return targetChunks.map((t, index) => ({ index, text: t }));
  }

  const withOverlap: string[] = [];
  for (let i = 0; i < targetChunks.length; i++) {
    if (i === 0) {
      withOverlap.push(targetChunks[i]);
    } else {
      const prev = targetChunks[i - 1];
      const tail = prev.slice(Math.max(0, prev.length - overlap));
      withOverlap.push(`${tail}\n${targetChunks[i]}`);
    }
  }
  return withOverlap.map((t, index) => ({ index, text: t }));
}

/** Детерминистичен SHA-256 на низ — за content_hash в knowledge_chunks. */
export async function sha256(input: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(input).digest("hex");
}
