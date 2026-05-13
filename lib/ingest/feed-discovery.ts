/**
 * Откриване на URL към документи от sitemap.xml / sitemap index или RSS/Atom,
 * без платен search API — само HTTP към подадения feed URL.
 */

import type { DiscoveredFile } from "@/lib/ingest/types";

const FILE_EXT_PATTERN = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;
const MAX_CHILD_SITEMAPS = 8;

function allowExternalLinks(): boolean {
  return process.env.INGEST_ALLOW_EXTERNAL_LINKS === "1";
}

function normalizeTitleFromUrl(fileUrl: string): string {
  const last = fileUrl.split("/").pop() || "document";
  return decodeURIComponent(last).replace(FILE_EXT_PATTERN, "").replace(/[-_]+/g, " ").trim();
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const u = m[1]?.trim();
    if (u) out.push(u);
  }
  return out;
}

function isHttpDocUrl(u: string, feedOrigin: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (!FILE_EXT_PATTERN.test(parsed.href)) return false;
  if (!allowExternalLinks() && parsed.origin !== feedOrigin) return false;
  return true;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AgriNexusBot/1.0 (+document-sync)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return res.text();
}

/**
 * Поддържа urlset или sitemapindex (ограничен брой дъщерни sitemap-и).
 */
export async function discoverFromSitemap(indexUrl: string, limit: number): Promise<DiscoveredFile[]> {
  const feedOrigin = new URL(indexUrl).origin;
  const cap = Math.min(Math.max(limit, 1), 50);
  const xml = await fetchText(indexUrl);
  const seen = new Set<string>();
  const files: DiscoveredFile[] = [];

  const pushUrl = (u: string) => {
    if (!isHttpDocUrl(u, feedOrigin) || seen.has(u)) return;
    seen.add(u);
    files.push({ fileUrl: u, title: normalizeTitleFromUrl(u) });
  };

  if (/<sitemapindex[\s>]/i.test(xml)) {
    const childMaps = extractLocs(xml)
      .filter((u) => /\.xml(\?|$)/i.test(u))
      .slice(0, MAX_CHILD_SITEMAPS);
    for (const sm of childMaps) {
      try {
        const inner = await fetchText(sm);
        for (const loc of extractLocs(inner)) {
          pushUrl(loc);
          if (files.length >= cap) return files;
        }
      } catch {
        /* пропускаме един повреден sitemap */
      }
    }
    return files;
  }

  for (const loc of extractLocs(xml)) {
    pushUrl(loc);
    if (files.length >= cap) break;
  }
  return files;
}

/**
 * RSS 2.0 / Atom: enclosure, <link> към документ, или голи https URL в item.
 */
export async function discoverFromRss(indexUrl: string, limit: number): Promise<DiscoveredFile[]> {
  const feedOrigin = new URL(indexUrl).origin;
  const cap = Math.min(Math.max(limit, 1), 50);
  const xml = await fetchText(indexUrl);
  const seen = new Set<string>();
  const files: DiscoveredFile[] = [];

  const pushUrl = (u: string) => {
    const trimmed = u.trim();
    if (!isHttpDocUrl(trimmed, feedOrigin) || seen.has(trimmed)) return;
    seen.add(trimmed);
    files.push({ fileUrl: trimmed, title: normalizeTitleFromUrl(trimmed) });
  };

  const enclosureRe = /<enclosure[^>]+?\burl\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = enclosureRe.exec(xml)) !== null) {
    pushUrl(m[1]);
    if (files.length >= cap) return files;
  }

  const linkHrefRe = /<link[^>]+href\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  while ((m = linkHrefRe.exec(xml)) !== null) {
    pushUrl(m[1]);
    if (files.length >= cap) return files;
  }

  const nakedHttps = /https?:\/\/[^\s<>"']+\.(?:pdf|docx?|xlsx?)(?:\?[^"'>\s]*)?/gi;
  while ((m = nakedHttps.exec(xml)) !== null) {
    pushUrl(m[0]);
    if (files.length >= cap) return files;
  }

  return files;
}
