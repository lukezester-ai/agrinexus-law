/**
 * PDF text extraction чрез pdfjs-dist (Mozilla, Node ESM legacy build).
 *
 * Модернизирана версия: 
 * Вместо просто линейно сливане, подреждаме текстовите елементи по 
 * техните X и Y координати. Това запазва структурата на таблиците и 
 * многоколонния текст, което е критично за нормативните документи.
 */
import type { TextItem } from "pdfjs-dist/types/src/display/api.js";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type PdfDocumentLike = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(opts?: {
      disableCombineTextItems?: boolean;
    }): Promise<{ items: TextItem[] }>;
    cleanup?: () => void;
  }>;
  destroy?: () => Promise<void> | void;
};

const MAX_PAGES = 200;

// Разстояние във Y-координатите, под което считаме, че текстът е на същия ред (заради sub/superscripts)
const Y_TOLERANCE = 3;

function joinTextItemsLayoutAware(items: TextItem[]): string {
  if (!items || items.length === 0) return "";

  // 1. Извличане на X и Y от матрицата на трансформация
  // В pdfjs: transform = [ scaleX, skewY, skewX, scaleY, transX, transY ]
  const enriched = items
    .filter(it => typeof it.str === "string")
    .map(it => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      width: it.width,
      hasEOL: it.hasEOL
    }));

  if (enriched.length === 0) return "";

  // 2. Групиране по редове (Y координата)
  // Сортираме по Y намаляващо (PDF координатите: Y расте нагоре)
  enriched.sort((a, b) => b.y - a.y);

  const lines: Array<typeof enriched> = [];
  let currentLine = [enriched[0]];
  let currentY = enriched[0].y;

  for (let i = 1; i < enriched.length; i++) {
    const item = enriched[i];
    if (Math.abs(currentY - item.y) <= Y_TOLERANCE) {
      currentLine.push(item);
    } else {
      lines.push(currentLine);
      currentLine = [item];
      currentY = item.y;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  // 3. Форматиране на всеки ред
  const textLines = lines.map(line => {
    // Сортиране по X нарастващо
    line.sort((a, b) => a.x - b.x);

    let lineText = "";
    let lastXEnd = -1;

    for (const item of line) {
      if (lastXEnd !== -1) {
        // Оценка на разстоянието между елементите. Ако е голямо -> добавяме \t (таб) за таблици
        const gap = item.x - lastXEnd;
        if (gap > 20) {
          lineText += "\t";
        } else if (gap > 2) {
          lineText += " ";
        }
      }
      lineText += item.str;
      lastXEnd = item.x + item.width;
    }
    return lineText;
  });

  return textLines.join("\n");
}

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const loadingTask = (
    pdfjs as unknown as {
      getDocument: (params: {
        data: Uint8Array;
        disableFontFace: boolean;
        useSystemFonts: boolean;
      }) => { promise: Promise<PdfDocumentLike> };
    }
  ).getDocument({
    data: bytes,
    disableFontFace: true,
    useSystemFonts: false,
  });
  const doc = await loadingTask.promise;

  try {
    const totalPages = Math.min(doc.numPages, MAX_PAGES);
    const pageTexts: string[] = [];
    for (let p = 1; p <= totalPages; p++) {
      const page = await doc.getPage(p);
      try {
        const tc = await page.getTextContent({
          disableCombineTextItems: false,
        });
        const text = joinTextItemsLayoutAware(tc.items as TextItem[]).trim();
        if (text.length > 0) pageTexts.push(text);
      } finally {
        try {
          page.cleanup?.();
        } catch {
          /* ignore */
        }
      }
    }
    return pageTexts.join("\n\n---\n\n").trim();
  } finally {
    try {
      await doc.destroy?.();
    } catch {
      /* ignore */
    }
  }
}
