/**
 * Typesense — лексикално търсене за обучително съдържание: видеа, PDF, уроци.
 * Колекцията се дефинира извън Next (виж docs/SEARCH-SYSTEM.md).
 */
import Typesense from "typesense";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";

const host = process.env.TYPESENSE_HOST?.trim();
const apiKey = process.env.TYPESENSE_API_KEY?.trim();
const collection =
  process.env.TYPESENSE_COLLECTION?.trim() || "agrinexus_learning_content";
const port = Number(process.env.TYPESENSE_PORT ?? "443");
const protocol = (process.env.TYPESENSE_PROTOCOL?.trim() || "https") as
  | "http"
  | "https";

let client: InstanceType<typeof Typesense.Client> | null = null;

export function isTypesenseConfigured(): boolean {
  return Boolean(host && apiKey);
}

function getClient(): InstanceType<typeof Typesense.Client> | null {
  if (!host || !apiKey) return null;
  if (client) return client;
  const cleanHost = host.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  client = new Typesense.Client({
    nodes: [{ host: cleanHost, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 8,
  });
  return client;
}

type TsKind = "video" | "pdf" | "lesson";

function isTsKind(v: unknown): v is TsKind {
  return v === "video" || v === "pdf" || v === "lesson";
}

function toKnowledgeDoc(raw: Record<string, unknown>): KnowledgeDoc | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  const title = typeof raw.title === "string" ? raw.title : null;
  if (!id || !title) return null;

  const kind = raw.kind;
  const type = isTsKind(kind) ? kind : "lesson";

  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  const transcript =
    typeof raw.transcript === "string" ? raw.transcript.trim() : "";
  const contentParts = [description, transcript].filter(Boolean);
  const content =
    contentParts.join("\n\n").slice(0, 8000) ||
    `Съдържание (${type}): ${title}`;

  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === "string")
    : [];
  const category =
    typeof raw.category === "string" && raw.category.trim()
      ? raw.category.trim()
      : "Обучение и ресурси";

  const sourceLabel =
    typeof raw.source_label === "string" && raw.source_label.trim()
      ? raw.source_label.trim()
      : "Typesense индекс";
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const published =
    typeof raw.published_at === "string" && raw.published_at.length >= 10
      ? raw.published_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const keywords = [
    type,
    ...tags,
    ...(typeof raw.instructor === "string" ? [raw.instructor] : []),
  ].filter(Boolean);

  return {
    id: `ts-${id}`,
    title,
    category,
    type,
    content,
    keywords,
    source: sourceLabel,
    effectiveDate: published,
    ...(url ? { sourceUrl: url } : {}),
  };
}

/**
 * Търсене в learning колекцията (видеа, PDF, уроци).
 * `query_by` трябва да съвпада със schema на колекцията (виж docs/SEARCH-SYSTEM.md).
 */
export async function searchWithTypesense(
  query: string,
  _category?: string,
): Promise<KnowledgeDoc[]> {
  const c = getClient();
  if (!c) return [];

  const queryBy =
    process.env.TYPESENSE_QUERY_BY?.trim() ||
    "title,description,transcript,tags";

  const res = await c.collections(collection).documents().search({
    q: query,
    query_by: queryBy,
    per_page: 14,
  });

  const out: KnowledgeDoc[] = [];
  for (const hit of res.hits ?? []) {
    const doc = hit.document as Record<string, unknown>;
    const kd = toKnowledgeDoc(doc);
    if (kd) out.push(kd);
  }
  return out;
}
