import type { KnowledgeDoc } from "@/lib/knowledge/dfz-knowledge";
import { getSupabaseAdmin } from "@/lib/supabase";

type LearnedRow = {
  id: string;
  title: string;
  category: string;
  type: string;
  content: string;
  keywords: string[] | null;
  source: string;
  effective_date: string | null;
  quality_score: number | null;
};

const MAX_ROWS = 400;
const CACHE_MS = 45_000;
let cache: { at: number; docs: KnowledgeDoc[] } | null = null;

function toKnowledgeDoc(row: LearnedRow): KnowledgeDoc {
  return {
    id: `learned-${row.id}`,
    title: row.title,
    category: row.category,
    type: row.type as KnowledgeDoc["type"],
    content: row.content,
    keywords: row.keywords ?? [],
    source: row.source || "Learned from chat feedback",
    effectiveDate: row.effective_date ?? new Date().toISOString().slice(0, 10),
  };
}

async function loadLearnedDocs(): Promise<KnowledgeDoc[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.docs;

  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("knowledge_learned_items")
    .select("id, title, category, type, content, keywords, source, effective_date, quality_score")
    .eq("is_active", true)
    .order("quality_score", { ascending: false, nullsFirst: false })
    .limit(MAX_ROWS);

  if (error || !data) {
    console.error("loadLearnedDocs failed:", error?.message);
    return [];
  }
  const docs = (data as LearnedRow[]).map(toKnowledgeDoc);
  cache = { at: now, docs };
  return docs;
}

function scoreDoc(doc: KnowledgeDoc, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (doc.title.toLowerCase().includes(q)) score += 6;
  if (doc.content.toLowerCase().includes(q)) score += 4;
  for (const kw of doc.keywords) {
    if (kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase())) score += 3;
  }
  return score;
}

export async function searchLearnedKnowledge(query: string, category?: string): Promise<KnowledgeDoc[]> {
  const docs = await loadLearnedDocs();
  const q = query.trim();
  if (!q) return [];
  const filtered = category && category !== "all" ? docs.filter(d => d.category === category) : docs;
  return filtered
    .map(doc => ({ doc, score: scoreDoc(doc, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(x => x.doc);
}

export async function getLearnedKnowledgeContext(query: string): Promise<string> {
  const docs = await searchLearnedKnowledge(query);
  if (!docs.length) return "";
  return docs
    .map(
      doc => `=== ${doc.title} ===
Категория: ${doc.category}
Източник: ${doc.source}

${doc.content}`
    )
    .join("\n\n");
}
