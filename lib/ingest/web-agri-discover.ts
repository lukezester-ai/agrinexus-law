import OpenAI from "openai";
import { googleCustomSearch, type GoogleCseHit } from "@/lib/ingest/google-cse-search";
import { downloadAndPersistPublicDoc } from "@/lib/ingest/download-and-persist-public-doc";
import type { IngestResult } from "@/lib/ingest/types";
import { getSupabaseAdmin } from "@/lib/supabase";

const DEFAULT_MODEL = "gpt-4o-mini";

function readIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return Math.min(Math.max(fallback, min), max);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return Math.min(Math.max(fallback, min), max);
  return Math.min(Math.max(n, min), max);
}

function buildSearchQuery(topic: string): string {
  const t = topic.trim().slice(0, 200);
  // Насочване към документи (PDF/офис), земеделие / CAP / България — CSE може допълнително да ограничава сайтове от конзолата.
  return `${t} (земеделие OR agriculture OR CAP OR ПСРР OR субсидии OR ДФЗ) (filetype:pdf OR filetype:doc OR filetype:docx)`;
}

type LlmPick = { url: string; title: string };

async function pickDocumentsWithOpenAI(
  topic: string,
  candidates: GoogleCseHit[],
  maxPick: number,
): Promise<LlmPick[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY липсва — нужен е за подбор на документи.");
  }
  if (candidates.length === 0) return [];

  const allowedUrls = new Set(candidates.map((c) => c.link));
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  const openai = new OpenAI({ apiKey });

  const payload = {
    topic,
    candidates: candidates.map((c) => ({
      url: c.link,
      title: c.title,
      snippet: c.snippet,
    })),
    maxPick,
  };

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Ти си редактор на агро-правни източници. Получаваш JSON с тема и кандидат-URL (с title/snippet от Google).
Върни САМО валиден JSON обект с ключ "approved": масив от най-много ${maxPick} елемента { "url", "title" }.
Избирай само URL, които изглеждат като официални или авторитетни за земеделие, CAP, субсидии, нормативни актове, методики (държавни, ЕС, университети, признати институции).
Отхвърляй: форуми, лични блогове, магазини, социални мрежи, съмнителни домейни.
Всяко "url" ТРЯБВА да е ТОЧНО един от подадените candidates[].url — без промяна, без измислени връзки.`,
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as { approved?: unknown };
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object" || !("approved" in parsed)) return [];
  const approved = (parsed as { approved: unknown }).approved;
  if (!Array.isArray(approved)) return [];

  const out: LlmPick[] = [];
  for (const row of approved) {
    if (out.length >= maxPick) break;
    if (!row || typeof row !== "object") continue;
    const url = typeof (row as { url?: unknown }).url === "string" ? (row as { url: string }).url.trim() : "";
    const title =
      typeof (row as { title?: unknown }).title === "string"
        ? (row as { title: string }).title.trim()
        : "";
    if (!allowedUrls.has(url)) continue;
    const hit = candidates.find((c) => c.link === url);
    out.push({ url, title: title || hit?.title || url });
  }
  return out;
}

/**
 * Търсене в мрежата (Google CSE) по земеделска тема → OpenAI подбор → сваляне в agro-docs + public_documents.
 * Пуска се само през защитения POST /api/ingest/run с mode: "web".
 */
export async function runWebAgricultureDocumentIngest(options: {
  topic: string;
  /** Резултати от CSE (1–10) */
  searchNum?: number;
  /** Колко URL да опита да свали след LLM подбор */
  maxDownloads?: number;
}): Promise<IngestResult> {
  const topic = options.topic.trim().slice(0, 400) || "земеделие субсидии CAP България";
  const searchNum = Math.min(
    Math.max(options.searchNum ?? readIntEnv("WEB_INGEST_CSE_NUM", 10, 1, 10), 1),
    10,
  );
  const maxDownloads = Math.min(
    Math.max(options.maxDownloads ?? readIntEnv("WEB_INGEST_MAX_DOWNLOADS", 5, 1, 10), 1),
    10,
  );
  const maxPick = Math.min(maxDownloads, searchNum);

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase admin client is not configured.");

  const sourceLabel = `web-agri:${topic.slice(0, 80)}`;
  const startedRun = await supabase
    .from("ingest_runs")
    .insert({ source_name: sourceLabel.slice(0, 120), status: "running" })
    .select("id")
    .single();
  const runId = startedRun.data?.id as string | undefined;

  const errors: string[] = [];
  let fetched = 0;
  let stored = 0;

  try {
    const query = buildSearchQuery(topic);
    const hits = await googleCustomSearch(query, searchNum);
    fetched = hits.length;

    const picks = await pickDocumentsWithOpenAI(topic, hits, maxPick);
    if (picks.length === 0 && hits.length > 0) {
      errors.push("LLM не одобри нито един URL (или отговорът не беше валиден JSON).");
    }

    const institution =
      process.env.WEB_INGEST_INSTITUTION_LABEL?.trim() || "Открито търсене (мрежа)";
    const category =
      process.env.WEB_INGEST_CATEGORY_LABEL?.trim() || "Земеделие — индексирани документи";

    const sourceKey = "web-agri";

    for (const pick of picks) {
      try {
        await downloadAndPersistPublicDoc(pick.url, pick.title, {
          sourceKey,
          institution,
          category,
          docType: "regulation",
        });
        stored += 1;
      } catch (e) {
        errors.push(`${pick.url}: ${e instanceof Error ? e.message : String(e)}`);
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

    return { source: sourceLabel, fetched, stored, errors };
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
