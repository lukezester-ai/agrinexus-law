import { discoverFilesFromIndex } from "@/lib/ingest/crawler";
import { downloadAndPersistPublicDoc } from "@/lib/ingest/download-and-persist-public-doc";
import { INGEST_SOURCES } from "@/lib/ingest/sources";
import type { IngestResult, IngestSource } from "@/lib/ingest/types";
import { getSupabaseAdmin } from "@/lib/supabase";

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
    const files = await discoverFilesFromIndex(source, limit);
    fetched = files.length;

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
  const limit = Math.min(Math.max(options?.limitPerSource ?? 10, 1), 50);
  const targets = options?.sourceName
    ? INGEST_SOURCES.filter((s) => s.name === options.sourceName)
    : INGEST_SOURCES;
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
