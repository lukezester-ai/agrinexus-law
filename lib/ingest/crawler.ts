import type { DiscoveredFile, IngestSource } from "@/lib/ingest/types";

const FILE_EXT_PATTERN = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;
const ALLOW_EXTERNAL_LINKS = process.env.INGEST_ALLOW_EXTERNAL_LINKS === "1";

function normalizeTitleFromUrl(fileUrl: string): string {
  const last = fileUrl.split("/").pop() || "document";
  return decodeURIComponent(last).replace(FILE_EXT_PATTERN, "").replace(/[-_]+/g, " ").trim();
}

function toAbsoluteUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export async function discoverFilesFromIndex(source: IngestSource, limit = 20): Promise<DiscoveredFile[]> {
  const res = await fetch(source.indexUrl, {
    headers: { "User-Agent": "AgriNexusBot/1.0 (+document-sync)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Index fetch failed: ${source.indexUrl} (${res.status})`);
  }
  const html = await res.text();
  const hrefMatches = html.match(/href\s*=\s*["']([^"']+)["']/gi) ?? [];
  const files: DiscoveredFile[] = [];
  const seen = new Set<string>();
  const baseOrigin = new URL(source.indexUrl).origin;

  for (const raw of hrefMatches) {
    const m = raw.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = m?.[1];
    if (!href) continue;
    const abs = toAbsoluteUrl(href, source.indexUrl);
    if (!abs) continue;
    if (!ALLOW_EXTERNAL_LINKS && new URL(abs).origin !== baseOrigin) continue;
    if (!FILE_EXT_PATTERN.test(abs)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    files.push({ fileUrl: abs, title: normalizeTitleFromUrl(abs) });
    if (files.length >= limit) break;
  }

  return files;
}
