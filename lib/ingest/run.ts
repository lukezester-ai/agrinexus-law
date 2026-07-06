import { discoverFilesFromIndex } from "@/lib/ingest/crawler";
import {
  discoverFromRss,
  discoverFromSitemap,
  discoverFromSitemapPages,
  extractPdfLinksFromHtml,
} from "@/lib/ingest/feed-discovery";
import { downloadAndPersistPublicDoc } from "@/lib/ingest/download-and-persist-public-doc";
import { getIngestSources } from "@/lib/ingest/sources";
import type { IngestResult, IngestSource } from "@/lib/ingest/types";
import { getSupabaseAdmin } from "@/lib/supabase";

const PDF_EXT_PATTERN = /\.(pdf)(\?|#|$)/i;

async function discoverFilesForSource(source: IngestSource, limit: number) {
  const mode = source.discoverMode ?? "html";
  if (mode === "sitemap") return discoverFromSitemap(source.indexUrl, limit);
  if (mode === "sitemap-html") return discoverFromSitemapPages(source.indexUrl, limit);
  if (mode === "rss") return discoverFromRss(source.indexUrl, limit);
  return discoverFilesFromIndex(source, limit);
}

/**
 * За sitemap-html режим: след като открием HTML страници, извличаме
 * PDF/office линкове от всяка от тях и ги връщаме като допълнителни файлове.
 */
async function discoverPdfsFromHtmlPages(
  pages: { fileUrl: string; title: string }[],
): Promise<{ fileUrl: string; title: string }[]> {
  const pdfs: { fileUrl: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    try {
      const links = await extractPdfLinksFromHtml(page.fileUrl);
      for (const link of links) {
        if (!seen.has(link.fileUrl)) {
          seen.add(link.fileUrl);
          pdfs.push(link);
        }
      }
    } catch {
      // skip pages that fail
    }
  }
  return pdfs;
}

async function runForSource(source: IngestSource, limit: number): Promise<IngestResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase admin client is not configured.");

  const startedRun = await supabase
    .from("ingest_runs")
    .insert({ source_name: source.name, status: "running" })
    .select("id")
    .single();
  const runId = startedRun.data?.id as string | undefined;

  let fetched = 0;
  let stored = 0;
  const errors: string[] = [];

  try {
    const files = await discoverFilesForSource(source, limit);
    fetched = files.length;

    // Ако сме в sitemap-html режим, извличаме PDF от HTML страниците
    let pdfFiles: { fileUrl: string; title: string }[] = [];
    if (source.discoverMode === "sitemap-html") {
      pdfFiles = await discoverPdfsFromHtmlPages(files);
      fetched += pdfFiles.length;
    }

    // Запазваме HTML страниците
    for (const file of files) {
      try {
        await downloadAndPersistPublicDoc(file.fileUrl, file.title || "Документ", {
          sourceKey: source.name,
          institution: source.institution,
          category: source.category,
          docType: source.docType,
        });
        stored += 1;
      } catch (e) {
        errors.push(`${file.fileUrl}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Запазваме PDF документите (с категория "Документи" за разграничение)
    for (const pdf of pdfFiles) {
      try {
        await downloadAndPersistPublicDoc(pdf.fileUrl, pdf.title || "PDF документ", {
          sourceKey: source.name,
          institution: source.institution,
          category: "Документи",
          docType: source.docType,
        });
        stored += 1;
      } catch (e) {
        errors.push(`${pdf.fileUrl}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (runId) {
      await supabase
        .from("ingest_runs")
        .update({
          status: errors.length ? "completed_with_errors" : "completed",
          fetched_count: fetched,
          stored_count: stored,
          error_message: errors.slice(0, 5).join(" | ") || null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return { source: source.name, fetched, stored, errors };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (runId) {
      await supabase
        .from("ingest_runs")
        .update({ status: "failed", error_message: msg, finished_at: new Date().toISOString() })
        .eq("id", runId);
    }
    throw e;
  }
}

export async function runDocumentIngest(options?: {
  sourceName?: string;
  limitPerSource?: number;
}): Promise<IngestResult[]> {
  const limit = Math.min(Math.max(options?.limitPerSource ?? 30, 1), 100);
  const targets = options?.sourceName
    ? getIngestSources().filter((s) => s.name === options.sourceName)
    : getIngestSources();
  if (targets.length === 0) {
    throw new Error(`Unknown source: ${options?.sourceName}`);
  }
  const results: IngestResult[] = [];
  for (const source of targets) {
    const item = await runForSource(source, limit);
    results.push(item);
  }
  return results;
}
