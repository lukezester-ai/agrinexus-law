import { search } from "duck-duck-scrape";

export type GoogleCseHit = {
  link: string;
  title: string;
  snippet: string;
};

const DOC_EXT = /\.(pdf|docx?|xlsx?)(\?|#|$)/i;

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a] = h.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && h.startsWith("192.168.")) return true;
    if (a === 172 && h.match(/^172\.(1[6-9]|2\d|3[01])\./)) return true;
  }
  return false;
}

/** Ограничение по домейн: ако env е зададен, приемаме само тези хостове. */
export function hostAllowedByPolicy(hostname: string): boolean {
  const raw = process.env.WEB_INGEST_ALLOWED_HOSTS?.trim();
  if (!raw) return true;
  const allowed = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const h = hostname.toLowerCase();
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

export function isEligibleDocumentUrl(urlStr: string): boolean {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (isBlockedHost(u.hostname)) return false;
  if (!hostAllowedByPolicy(u.hostname)) return false;
  if (!DOC_EXT.test(u.pathname + u.search)) return false;
  return true;
}

/**
 * Използваме DuckDuckGo (безплатен скрапер) вместо Google CSE.
 * Запазваме името на функцията, за да не чупим останалия код.
 */
export async function googleCustomSearch(
  query: string,
  num: number,
): Promise<GoogleCseHit[]> {
  const n = Math.min(Math.max(Math.floor(num), 1), 20);
  
  // Добавяме filetype:pdf ако не е изрично казано (това е хак, но върши работа)
  let ddgQuery = query;

  try {
    const searchResults = await search(ddgQuery);
    const items = searchResults.results || [];
    
    const out: GoogleCseHit[] = [];
    let count = 0;
    
    for (const it of items) {
      if (count >= n) break;
      const link = typeof it.url === "string" ? it.url.trim() : "";
      if (!link || !isEligibleDocumentUrl(link)) continue;
      
      out.push({
        link,
        title: (it.title ?? "").replace(/<[^>]+>/g, "").trim() || link,
        snippet: (it.description ?? "").replace(/<[^>]+>/g, "").trim(),
      });
      count++;
    }
    return out;
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    throw new Error(`Грешка при търсене с DuckDuckGo: ${error instanceof Error ? error.message : "Неизвестна грешка"}`);
  }
}
