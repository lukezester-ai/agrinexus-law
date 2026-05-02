import { Meilisearch } from "meilisearch";
import { KNOWLEDGE_BASE, type KnowledgeDoc } from "@/lib/knowledge/dfz-knowledge";

type KnowledgeIndexDoc = KnowledgeDoc & { searchableText: string };

const host = process.env.MEILI_HOST?.trim();
const apiKey = process.env.MEILI_API_KEY?.trim();
const indexName = process.env.MEILI_INDEX?.trim() || "knowledge_docs";

export function isMeiliConfigured(): boolean {
  return Boolean(host);
}

function getClient(): Meilisearch | null {
  if (!host) return null;
  return new Meilisearch({ host, apiKey });
}

let indexReady = false;

function toIndexDoc(doc: KnowledgeDoc): KnowledgeIndexDoc {
  return {
    ...doc,
    searchableText: [doc.title, doc.content, doc.category, doc.type, ...doc.keywords].join(" "),
  };
}

async function ensureIndex(): Promise<void> {
  if (indexReady) return;
  const client = getClient();
  if (!client) return;

  const index = client.index<KnowledgeIndexDoc>(indexName);
  const existing = await client.getIndexes({ limit: 100 });
  if (!existing.results.some(i => i.uid === indexName)) {
    await client.createIndex(indexName, { primaryKey: "id" });
  }

  await index.updateSearchableAttributes(["title", "keywords", "content", "searchableText", "category", "source"]);
  await index.updateFilterableAttributes(["category", "type"]);
  await index.updateSortableAttributes(["effectiveDate"]);
  await index.updateRankingRules(["words", "typo", "proximity", "attribute", "exactness", "sort"]);

  indexReady = true;
}

let seeded = false;

async function ensureSeed(): Promise<void> {
  if (seeded) return;
  const client = getClient();
  if (!client) return;

  await ensureIndex();
  const index = client.index<KnowledgeIndexDoc>(indexName);
  const stats = await index.getStats();

  if (stats.numberOfDocuments < KNOWLEDGE_BASE.length) {
    const docs = KNOWLEDGE_BASE.map(toIndexDoc);
    await index.addDocuments(docs);
  }
  seeded = true;
}

export async function searchWithMeili(query: string, category?: string): Promise<KnowledgeDoc[]> {
  const client = getClient();
  if (!client) return [];

  await ensureSeed();
  const index = client.index<KnowledgeIndexDoc>(indexName);
  const filter = category && category !== "all" ? `category = "${category.replace(/"/g, '\\"')}"` : undefined;

  const result = await index.search(query, {
    limit: 12,
    filter,
    attributesToRetrieve: [
      "id",
      "title",
      "category",
      "type",
      "content",
      "keywords",
      "source",
      "effectiveDate",
    ],
  });

  return result.hits.map(hit => ({
    id: hit.id,
    title: hit.title,
    category: hit.category,
    type: hit.type,
    content: hit.content,
    keywords: hit.keywords,
    source: hit.source,
    effectiveDate: hit.effectiveDate,
  }));
}
