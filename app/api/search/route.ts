import {
  summarizeKnowledgeQuery,
  type KnowledgeDoc,
} from "@/lib/knowledge/dfz-knowledge";
import { categoryMatchesFilter, sortDocuments } from "@/lib/knowledge/document-taxonomy";
import { searchLearnedKnowledge } from "@/lib/knowledge/learned-knowledge";
import { mergeKnowledgeSearchResults } from "@/lib/knowledge/merged-search";
import { searchPublicDocuments } from "@/lib/knowledge/public-documents-search";
import { isMeiliConfigured, searchWithMeili } from "@/lib/meilisearch";
import { isTypesenseConfigured, searchWithTypesense } from "@/lib/typesense";
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
    let externalSlice: KnowledgeDoc[] = [];
    let lexicalSource: "typesense" | "meili" | "none" = "none";

    if (isTypesenseConfigured()) {
      try {
        externalSlice = await searchWithTypesense(q, category);
        if (externalSlice.length > 0) lexicalSource = "typesense";
      } catch (tsErr) {
        console.error("Typesense fallback:", tsErr);
      }
    }

    if (lexicalSource === "none" && isMeiliConfigured()) {
      try {
        externalSlice = await searchWithMeili(q, category);
        if (externalSlice.length > 0) lexicalSource = "meili";
      } catch (meiliErr) {
        console.error("Meilisearch fallback to internal-ai:", meiliErr);
      }
    }

    let engine: "typesense+internal" | "meili+internal" | "internal-ai" =
      lexicalSource === "typesense"
        ? "typesense+internal"
        : lexicalSource === "meili"
          ? "meili+internal"
          : "internal-ai";

    const [learnedSlice, publicSlice] = await Promise.all([
      searchLearnedKnowledge(q, category),
      searchPublicDocuments(q, 8),
    ]);

    let results = mergeKnowledgeSearchResults(q, externalSlice);
    if (learnedSlice.length || publicSlice.length) {
      const mergedById = new Map<string, KnowledgeDoc>();
      for (const doc of [...publicSlice, ...learnedSlice, ...results]) {
        mergedById.set(doc.id, doc);
      }
      results = Array.from(mergedById.values());
    }

    if (category && category !== "all") {
      results = results.filter((doc) => categoryMatchesFilter(doc, category));
    }

    if (results.length === 0) {
      results = mergeKnowledgeSearchResults(q, []);
      const pubFallback = await searchPublicDocuments(q, 6);
      for (const doc of pubFallback) {
        if (!results.some((r) => r.id === doc.id)) results.push(doc);
      }
      if (category && category !== "all") {
        results = results.filter((doc) => categoryMatchesFilter(doc, category));
      }
      engine = "internal-ai";
    }

    results = sortDocuments(
      results.map((d, i) => ({ ...d, score: results.length - i })),
      "relevance",
    ) as KnowledgeDoc[];

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
