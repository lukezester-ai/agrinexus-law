/**
 * Вътрешно търсене без външни API ключове (Meilisearch/OpenAI).
 * BM25-подобно ранжиране + синоними + кратко извлечено резюме от базата знания.
 */
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";

const STOP = new Set([
  "и",
  "на",
  "за",
  "от",
  "до",
  "по",
  "при",
  "че",
  "как",
  "какво",
  "кои",
  "кой",
  "коя",
  "с",
  "в",
  "не",
  "ни",
  "му",
  "ми",
  "ти",
  "ви",
  "им",
  "е",
  "са",
  "си",
  "ще",
  "да",
  "ли",
  "ако",
  "или",
  "но",
  "със",
  "без",
  "все",
  "още",
  "това",
  "тези",
  "този",
  "такава",
  "такъв",
  "много",
  "при",
  "само",
  "всички",
  "всяка",
  "всеки",
]);

/** Разширяване на заявката с чести варианти / латиница. */
const SYNONYMS: Record<string, string[]> = {
  бисс: ["бисс", "бис"],
  бис: ["бисс", "бис"],
  биссс: ["бисс"],
  dfz: ["дфз"],
  дфз: ["dfz"],
  осп: ["обща селскостопанска политика"],
  исак: ["isak"],
  isak: ["исак"],
  екосхем: ["екосхема", "екосхеми"],
  био: ["биологично", "органично"],
  органично: ["биологично"],
  субсид: ["плащане", "подпомагане", "директни плащания"],
  наредб: ["наредба", "нормативен акт", "изисквания"],
  наредби: ["наредба", "нормативен акт"],
  наредба: ["наредби", "дфз"],
  деклар: ["декларация", "заявление"],
  заявлен: ["подаване", "искане", "кампания"],
  млад: ["млади фермери", "млад фермер"],
  срок: ["срокове", "дата"],
  жалба: ["обжалване", "възражение"],
};

function normalizeRaw(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u2013\u2014\-_/]+/g, " ");
}

/** Думи на кирилица и латиница (вкл. ъ, ьо и т.н. след нормализация). */
function tokenize(text: string): string[] {
  const n = normalizeRaw(text);
  const raw = n.match(/[a-zа-яё0-9]+/gi) ?? [];
  return raw.map(t => t.toLowerCase()).filter(t => t.length > 1 && !STOP.has(t));
}

function expandTerms(terms: string[]): string[] {
  const out = new Set<string>();
  for (const t of terms) {
    out.add(t);
    const syn = SYNONYMS[t];
    if (syn) for (const x of syn) for (const w of tokenize(x)) out.add(w);
    for (const [key, vals] of Object.entries(SYNONYMS)) {
      if (t.startsWith(key) || key.startsWith(t)) {
        out.add(key);
        for (const v of vals) for (const w of tokenize(v)) out.add(w);
      }
    }
  }
  return [...out];
}

type DocTokens = {
  doc: KnowledgeDoc;
  tfTitle: Map<string, number>;
  tfKw: Map<string, number>;
  tfBody: Map<string, number>;
  len: number;
};

function countTokens(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function mergeTf(into: Map<string, number>, from: Map<string, number>, weight: number) {
  for (const [t, c] of from) {
    into.set(t, (into.get(t) ?? 0) + c * weight);
  }
}

function buildDocTokens(doc: KnowledgeDoc): DocTokens {
  const titleTok = tokenize(doc.title);
  const kwTok = doc.keywords.flatMap(k => tokenize(k));
  const bodyTok = tokenize(doc.content);
  const tfTitle = countTokens(titleTok);
  const tfKw = countTokens(kwTok);
  const tfBody = countTokens(bodyTok);
  const len = titleTok.length + kwTok.length + Math.min(bodyTok.length, 800);
  return { doc, tfTitle, tfKw, tfBody, len };
}

function weightedTf(maps: DocTokens, term: string): number {
  return (
    3 * (maps.tfTitle.get(term) ?? 0) +
    2 * (maps.tfKw.get(term) ?? 0) +
    1 * (maps.tfBody.get(term) ?? 0)
  );
}

let corpusCache: {
  ref: KnowledgeDoc[];
  docs: DocTokens[];
  avgLen: number;
  N: number;
  df: Map<string, number>;
} | null = null;

function getCorpus(documents: KnowledgeDoc[]) {
  if (corpusCache && corpusCache.ref === documents) return corpusCache;
  const docs = documents.map(buildDocTokens);
  const N = docs.length;
  const df = new Map<string, number>();
  for (const d of docs) {
    const seen = new Set<string>();
    const add = (t: string) => {
      if (seen.has(t)) return;
      seen.add(t);
      df.set(t, (df.get(t) ?? 0) + 1);
    };
    for (const t of d.tfTitle.keys()) add(t);
    for (const t of d.tfKw.keys()) add(t);
    for (const t of d.tfBody.keys()) add(t);
  }
  const avgLen = docs.reduce((s, d) => s + d.len, 0) / Math.max(N, 1);
  corpusCache = { ref: documents, docs, avgLen, N, df };
  return corpusCache;
}

function idf(term: string, N: number, df: Map<string, number>): number {
  const n = df.get(term) ?? 0;
  return Math.log(1 + (N - n + 0.5) / (n + 0.5));
}

/** BM25 с тегловни полета (заглавие / ключови / текст). */
function bm25Score(d: DocTokens, queryTerms: string[], avgLen: number, N: number, df: Map<string, number>): number {
  const k1 = 1.2;
  const b = 0.75;
  let score = 0;
  for (const t of queryTerms) {
    const f = weightedTf(d, t);
    if (f <= 0) continue;
    const idfVal = idf(t, N, df);
    const lenNorm = k1 * (1 - b + (b * d.len) / avgLen);
    score += idfVal * ((f * (k1 + 1)) / (f + lenNorm));
  }
  return score;
}

/** Частично съвпадение на корени (за кирилица без stemmer). */
function fuzzyBonus(d: DocTokens, queryTerms: string[]): number {
  let bonus = 0;
  const hay = [
    ...d.tfTitle.keys(),
    ...d.tfKw.keys(),
    ...Array.from(d.tfBody.keys()).slice(0, 200),
  ];
  for (const q of queryTerms) {
    if (q.length < 4) continue;
    for (const h of hay) {
      if (h.includes(q) || q.includes(h)) bonus += 0.35;
    }
  }
  return bonus;
}

export type InternalSearchResult = {
  results: KnowledgeDoc[];
  scores: number[];
};

/**
 * Ранжира документите без външни услуги.
 */
export function internalKnowledgeSearch(
  query: string,
  documents: KnowledgeDoc[],
  opts?: { limit?: number }
): InternalSearchResult {
  const limit = opts?.limit ?? 8;
  const rawTerms = tokenize(query);
  const queryTerms = rawTerms.length ? expandTerms(rawTerms) : [];

  if (queryTerms.length === 0 || documents.length === 0) {
    return { results: [], scores: [] };
  }

  const { docs, avgLen, N, df } = getCorpus(documents);

  const ranked = docs
    .map(d => {
      const base = bm25Score(d, queryTerms, avgLen, N, df);
      const fuzzy = fuzzyBonus(d, queryTerms);
      return { doc: d.doc, score: base + fuzzy };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    results: ranked.map(r => r.doc),
    scores: ranked.map(r => r.score),
  };
}

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+|\n+/);
  return parts.map(s => s.trim()).filter(s => s.length > 24);
}

/**
 * Извлича 1–2 изречения от топ документите с най-голямо покритие на заявката (без LLM).
 */
export function extractKnowledgeSummary(query: string, docs: KnowledgeDoc[]): string | null {
  if (docs.length === 0) return null;
  const qTerms = expandTerms(tokenize(query));
  if (qTerms.length === 0) return null;

  const candidates: { text: string; score: number }[] = [];

  for (const doc of docs.slice(0, 3)) {
    const blob = `${doc.title}. ${doc.content}`;
    for (const sent of splitSentences(blob)) {
      const stok = new Set(tokenize(sent));
      let hits = 0;
      for (const t of qTerms) {
        if (stok.has(t)) hits += 2;
        else {
          for (const x of stok) {
            if (x.includes(t) || t.includes(x)) {
              hits += 1;
              break;
            }
          }
        }
      }
      const score = hits / Math.sqrt(sent.length / 50 + 1);
      if (hits > 0) candidates.push({ text: sent, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, 2).map(c => c.text);
  if (top.length === 0) {
    const d0 = docs[0];
    const rough = d0.content.split(/\n+/).map(l => l.trim()).find(l => l.length > 40);
    return rough ? `${d0.title}: ${rough.slice(0, 280)}…` : `${d0.title} — вижте пълния текст в резултата по-долу.`;
  }
  return top.join(" ");
}
