import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

const FILE_EXT_PATTERN = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;
const DOWNLOAD_TIMEOUT_MS = Math.max(
  3000,
  Number.parseInt(process.env.INGEST_DOWNLOAD_TIMEOUT_MS || "15000", 10),
);
const MAX_FILE_BYTES = Math.max(
  64 * 1024,
  Number.parseInt(process.env.INGEST_MAX_FILE_BYTES || "15728640", 10),
);

function safeSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function titleFromHtml(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m) return m[1].replace(/[-–|].*$/, "").trim();
  return fallback;
}

function detectEffectiveDateFromTitle(title: string): string | null {
  const year = title.match(/\b(20\d{2})\b/)?.[1];
  return year ? `${year}-01-01` : null;
}

async function readBodyWithLimit(resp: Response, maxBytes: number): Promise<Uint8Array> {
  const lenHeader = resp.headers.get("content-length");
  if (lenHeader) {
    const declared = Number.parseInt(lenHeader, 10);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error(`file too large (${declared} > ${maxBytes})`);
    }
  }

  const body = resp.body;
  if (!body) return new Uint8Array(await resp.arrayBuffer());
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`file too large (${total} > ${maxBytes})`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export type PublicDocPersistMeta = {
  sourceKey: string;
  institution: string;
  category: string;
  docType: "regulation" | "procedure" | "deadline" | "scheme";
};

/**
 * Изтегля файл по HTTP и го записва в agro-docs + public_documents (като съществуващия ingest).
 * Ако URL-ът е HTML страница, записва inline текста вместо storage.
 */
export async function downloadAndPersistPublicDoc(
  fileUrl: string,
  title: string,
  meta: PublicDocPersistMeta,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase admin client is not configured.");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort("timeout"), DOWNLOAD_TIMEOUT_MS);
  const resp = await fetch(fileUrl, {
    cache: "no-store",
    signal: ctrl.signal,
    headers: { "User-Agent": "AgriNexusBot/1.0 (+document-sync)" },
  }).finally(() => clearTimeout(timer));
  if (!resp.ok) throw new Error(`download failed (${resp.status})`);

  const contentType = resp.headers.get("content-type") || "";
  const isBinary = FILE_EXT_PATTERN.test(fileUrl) || /pdf|officedocument|word|spreadsheet/i.test(contentType);

  let hash: string;
  let storagePath: string;

  if (isBinary) {
    const bytes = await readBodyWithLimit(resp, MAX_FILE_BYTES);
    hash = createHash("sha256").update(bytes).digest("hex");
    const ext = fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "bin";
    const year = new Date().getFullYear();
    storagePath = `${safeSlug(meta.sourceKey)}/${year}/${hash}.${ext}`;

    const upload = await supabase.storage
      .from("agro-docs")
      .upload(storagePath, bytes, {
        upsert: false,
        contentType: resp.headers.get("content-type") || undefined,
      });
    if (upload.error && !/already exists/i.test(upload.error.message)) {
      throw new Error(upload.error.message);
    }
  } else {
    const html = await resp.text();
    const text = stripHtml(html).slice(0, 50000);
    hash = createHash("sha256").update(fileUrl + text.slice(0, 1000)).digest("hex");
    storagePath = `inline:${fileUrl}`;
  }

  const upsert = await supabase.from("public_documents").upsert(
    {
      title: title || "Документ",
      institution: meta.institution,
      category: meta.category,
      doc_type: meta.docType,
      status: "active",
      source_url: fileUrl,
      storage_path: storagePath,
      content_hash: hash,
      effective_date: detectEffectiveDateFromTitle(title),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_url" },
  );
  if (upsert.error) throw new Error(upsert.error.message);
}
