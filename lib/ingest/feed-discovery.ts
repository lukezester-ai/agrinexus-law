/**
 * Откриване на URL към документи от sitemap.xml / sitemap index или RSS/Atom,
 * без платен search API — само HTTP към подадения feed URL.
 */

import type { DiscoveredFile } from "@/lib/ingest/types";

const FILE_EXT_PATTERN = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;
const SKIP_EXT_PATTERN = /\.(jpg|jpeg|png|gif|svg|css|js|ico|json|xml|rss|atom|woff2?|ttf|eot|mp[3-4]|avi|mov|webm)(\?|#|$)/i;
const MAX_CHILD_SITEMAPS = 10;

function allowExternalLinks(): boolean {
  return process.env.INGEST_ALLOW_EXTERNAL_LINKS === "1";
}

function normalizeTitleFromUrl(fileUrl: string): string {
  const segs = fileUrl.split("/").filter(Boolean);
  const rawLast = (segs[segs.length - 1] || "").split("?")[0];
  const rawSecondLast = segs.length >= 2 ? (segs[segs.length - 2] || "").split("?")[0] : "";
  // Ако последният сегмент е UUID (hex с тирета), ползваме предпоследния
  const isUuid = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i.test(rawLast);
  const candidate = isUuid ? rawSecondLast : rawLast;
  const t = decodeURIComponent(candidate).replace(FILE_EXT_PATTERN, "").replace(/[-_+]+/g, " ").trim();
  return t.length > 90 ? t.slice(0, 90) : t;
}

function titleFromHtml(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m) return m[1].replace(/[-–|].*$/, "").trim();
  return fallback;
}

/** Сравнява origins, игнорирайки www. префикс (mzh.government.bg === www.mzh.government.bg) */
function sameOrigin(a: string, b: string): boolean {
  try {
    const stripWww = (s: string) => new URL(s).host.replace(/^www\./, "");
    return stripWww(a) === stripWww(b);
  } catch { return false; }
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
  try { parsed = new URL(u); } catch { return false; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (!FILE_EXT_PATTERN.test(parsed.href)) return false;
  if (!allowExternalLinks() && !sameOrigin(u, feedOrigin)) return false;
  return true;
}

/**
 * За direct-urls режим: връща предварително зададен списък с URLs.
 */
export function discoverFromUrlList(
  urls: string[],
): { fileUrl: string; title: string }[] {
  const seen = new Set<string>();
  const result: { fileUrl: string; title: string }[] = [];
  for (const url of urls) {
    const key = url.includes("/documents/") ? url.split("?")[0].replace(/\/[^/]+$/, "") : url.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    const t = normalizeTitleFromUrl(url);
    result.push({ fileUrl: url, title: t || "Документ" });
  }
  return result;
}

/** Приема HTML страници (не само файлове) — пропуска медийни/ресурсни URL. */
function isHttpPageUrl(u: string, feedOrigin: string): boolean {
  let parsed: URL;
  try { parsed = new URL(u); } catch { return false; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (!allowExternalLinks() && !sameOrigin(u, feedOrigin)) return false;
  if (FILE_EXT_PATTERN.test(parsed.href)) return true; // PDF/doc са ОК
  if (SKIP_EXT_PATTERN.test(parsed.href)) return false; // skip media
  const path = parsed.pathname;
  if (path === "/" || path === "") return false;
  // Skip non-relevant paths
  if (/^\/media\//i.test(path)) return false;
  if (/^\/bg\/(novini|obyavi|contact|dzfp)\b/i.test(path)) return false;
  if (/^\/en\/(news|announcements|contact)\b/i.test(path)) return false;
  const segs = path.split("/").filter(Boolean);
  if (segs.length < 2) return false;
  return true;
}

function normalizeHtmlTitle(url: string, html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m) return m[1].trim();
  return normalizeTitleFromUrl(url);
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
 * Като discoverFromSitemap, но приема и HTML страници (не само файлове).
 * Използва се за сайтове, чиито sitemap-ове съдържат предимно HTML линкове (ДФЗ, МЗХ).
 */
export async function discoverFromSitemapPages(
  indexUrl: string,
  limit: number,
): Promise<DiscoveredFile[]> {
  const feedOrigin = new URL(indexUrl).origin;
  const cap = Math.min(Math.max(limit, 1), 100);
  const xml = await fetchText(indexUrl);
  const seen = new Set<string>();
  const files: DiscoveredFile[] = [];

  const pushUrl = (u: string) => {
    if (!isHttpPageUrl(u, feedOrigin) || seen.has(u)) return;
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
        // skip broken sitemap
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
 * Извлича PDF/office линкове от HTML страница.
 */
export async function extractPdfLinksFromHtml(
  pageUrl: string,
): Promise<DiscoveredFile[]> {
  let html: string;
  try {
    html = await fetchText(pageUrl);
  } catch {
    return [];
  }

  const origin = new URL(pageUrl).origin;
  const links: DiscoveredFile[] = [];
  const seen = new Set<string>();

  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1]?.trim();
    if (!href) continue;
    let abs: string;
    try { abs = new URL(href, pageUrl).toString(); } catch { continue; }
    if (!FILE_EXT_PATTERN.test(abs)) continue;
    // Skip media files (personal docs, etc.)
    if (/\/media\/filer_public\//i.test(abs)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    links.push({ fileUrl: abs, title: normalizeTitleFromUrl(abs) });
  }
  return links;
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
