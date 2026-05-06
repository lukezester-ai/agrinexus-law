import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { discoverFilesFromIndex } from "@/lib/ingest/crawler";
import { INGEST_SOURCES } from "@/lib/ingest/sources";
import type { IngestResult, IngestSource } from "@/lib/ingest/types";

function safeSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function detectEffectiveDateFromTitle(title: string): string | null {
  const year = title.match(/\b(20\d{2})\b/)?.[1];
  return year ? `${year}-01-01` : null;
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
    const files = await discoverFilesFromIndex(source, limit);
    fetched = files.length;

    for (const file of files) {
      try {
        const resp = await fetch(file.fileUrl, { cache: "no-store" });
        if (!resp.ok) throw new Error(`download failed (${resp.status})`);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        const hash = createHash("sha256").update(bytes).digest("hex");
        const ext = file.fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "bin";
        const year = new Date().getFullYear();
        const storagePath = `${safeSlug(source.name)}/${year}/${hash}.${ext}`;

        const upload = await supabase.storage
          .from("agro-docs")
          .upload(storagePath, bytes, { upsert: false, contentType: resp.headers.get("content-type") || undefined });

        if (upload.error && !/already exists/i.test(upload.error.message)) {
          throw new Error(upload.error.message);
        }

        const upsert = await supabase.from("public_documents").upsert(
          {
            title: file.title || "Документ",
            institution: source.institution,
            category: source.category,
            doc_type: source.docType,
            status: "active",
            source_url: file.fileUrl,
            storage_path: storagePath,
            content_hash: hash,
            effective_date: detectEffectiveDateFromTitle(file.title),
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "source_url" }
        );
        if (upsert.error) throw new Error(upsert.error.message);
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
