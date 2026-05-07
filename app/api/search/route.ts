import {
  summarizeKnowledgeQuery,
  type KnowledgeDoc,
} from "@/lib/knowledge/dfz-knowledge";
import { searchLearnedKnowledge } from "@/lib/knowledge/learned-knowledge";
import { mergeKnowledgeSearchResults } from "@/lib/knowledge/merged-search";
import { isMeiliConfigured, searchWithMeili } from "@/lib/meilisearch";
import { searchRateLimit, checkRateLimit, extractClientIp } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = extractClientIp(req);
    const rateLimitResult = await checkRateLimit(searchRateLimit, ip);
    if (!rateLimitResult.success) {
      return Response.json(
        { error: "Твърде много търсения. Изчакай малко и опитай пак." },
        { status: 429 },
      );
    }

    const { query, category } = await req.json();

    if (!query || query.trim().length < 2) {
      return Response.json({ results: [], engine: "internal-ai" as const });
    }

    const q = query.trim();
    let meiliSlice: KnowledgeDoc[] = [];
    let engine: "meili+internal" | "internal-ai" = "internal-ai";

    if (isMeiliConfigured()) {
      try {
        meiliSlice = await searchWithMeili(q, category);
        engine = "meili+internal";
      } catch (meiliErr) {
        console.error("Meilisearch fallback to internal-ai:", meiliErr);
      }
    }
    const learnedSlice = await searchLearnedKnowledge(q, category);

    let results = mergeKnowledgeSearchResults(q, meiliSlice);
    if (learnedSlice.length) {
      const mergedById = new Map<string, KnowledgeDoc>();
      for (const doc of [...learnedSlice, ...results]) mergedById.set(doc.id, doc);
      results = Array.from(mergedById.values());
    }

    if (category && category !== "all") {
      results = results.filter((doc) => doc.category === category);
    }

    if (results.length === 0) {
      results = mergeKnowledgeSearchResults(q, []);
      if (category && category !== "all") {
        results = results.filter((doc) => doc.category === category);
      }
      engine = "internal-ai";
    }

    const aiSummary = summarizeKnowledgeQuery(q, results);

    return Response.json({
      results,
      total: results.length,
      engine,
      aiSummary,
    });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json(
      { error: "Грешка при търсене" },
      { status: 500 }
    );
  }
}
