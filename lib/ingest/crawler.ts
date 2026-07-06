import type { DiscoveredFile, IngestSource } from "@/lib/ingest/types";

const FILE_EXT_PATTERN = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;
const SKIP_EXT_PATTERN = /\.(jpg|jpeg|png|gif|svg|css|js|ico|json|xml|rss|atom|woff2?|ttf|eot|mp[3-4]|avi|mov|webm)(\?|#|$)/i;
const ALLOW_EXTERNAL_LINKS = process.env.INGEST_ALLOW_EXTERNAL_LINKS === "1";

function normalizeTitleFromUrl(fileUrl: string): string {
  const segs = fileUrl.split("/").filter(Boolean);
  const last = segs.pop() || "document";
  return decodeURIComponent(last).replace(FILE_EXT_PATTERN, "").replace(/[-_]+/g, " ").trim();
}

function toAbsoluteUrl(href: string, base: string): string | null {
  try { return new URL(href, base).toString(); } catch { return null; }
}

function sameHost(a: string, b: string): boolean {
  try {
    const stripWww = (s: string) => new URL(s).host.replace(/^www\./, "");
    return stripWww(a) === stripWww(b);
  } catch { return false; }
}

function isHtmlPageUrl(url: string, baseOrigin: string): boolean {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (!ALLOW_EXTERNAL_LINKS && !sameHost(url, baseOrigin)) return false;
  if (FILE_EXT_PATTERN.test(parsed.href)) return true;
  if (SKIP_EXT_PATTERN.test(parsed.href)) return false;
  const path = parsed.pathname;
  if (/^\/media\//i.test(path)) return false;
  if (/^\/bg\/(novini|obyavi|contact|dzfp)\b/i.test(path)) return false;
  if (/^\/en\/(news|announcements|contact)\b/i.test(path)) return false;
  const segs = parsed.pathname.split("/").filter(Boolean);
  if (segs.length < 2) return false;
  return true;
}

export async function discoverFilesFromIndex(source: IngestSource, limit = 20): Promise<DiscoveredFile[]> {
  const res = await fetch(source.indexUrl, {
    headers: { "User-Agent": "AgriNexusBot/1.0 (+document-sync)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Index fetch failed: ${source.indexUrl} (${res.status})`);
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
    if (!isHtmlPageUrl(abs, baseOrigin)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    files.push({ fileUrl: abs, title: normalizeTitleFromUrl(abs) });
    if (files.length >= limit) break;
  }
  return files;
}
