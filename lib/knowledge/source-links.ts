import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";

export function getKnowledgeSourceUrl(doc: Pick<KnowledgeDoc, "title" | "source">): string {
  const source = doc.source.toLowerCase();
  if (source.includes("eur-lex")) return "https://eur-lex.europa.eu/";
  if (source.includes("дфз") || source.includes("dfz")) return "https://www.dfz.bg/";
  if (source.includes("мзх") || source.includes("mzh")) return "https://www.mzh.government.bg/";
  if (source.includes("бабх") || source.includes("babh")) return "https://www.babh.government.bg/";
  if (source.includes("иасас") || source.includes("iasas")) return "https://www.iasas.government.bg/";
  if (source.includes("държавен вестник") || source.includes("dv.parliament")) {
    return "https://dv.parliament.bg/";
  }
  if (source.includes("lex")) return "https://lex.bg/";

  const q = encodeURIComponent(`${doc.title} ${doc.source}`.trim());
  return `https://www.google.com/search?q=${q}`;
}

