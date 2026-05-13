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
 * Google Programmable Search JSON API (Custom Search).
 * @see https://developers.google.com/custom-search/v1/overview
 */
export async function googleCustomSearch(
  query: string,
  num: number,
): Promise<GoogleCseHit[]> {
  const key = process.env.GOOGLE_CSE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_CX?.trim();
  if (!key || !cx) {
    throw new Error(
      "Липсват GOOGLE_CSE_API_KEY или GOOGLE_CSE_CX — нужни са за търсене в мрежата.",
    );
  }

  const n = Math.min(Math.max(Math.floor(num), 1), 10);
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(n));

  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Google CSE HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  const json = JSON.parse(text) as {
    items?: { link?: string; title?: string; snippet?: string }[];
  };
  const items = json.items ?? [];
  const out: GoogleCseHit[] = [];
  for (const it of items) {
    const link = typeof it.link === "string" ? it.link.trim() : "";
    if (!link || !isEligibleDocumentUrl(link)) continue;
    out.push({
      link,
      title: (it.title ?? "").replace(/<[^>]+>/g, "").trim() || link,
      snippet: (it.snippet ?? "").replace(/<[^>]+>/g, "").trim(),
    });
  }
  return out;
}
