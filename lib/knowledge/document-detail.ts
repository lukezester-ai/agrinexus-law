import { KNOWLEDGE_BASE, type KnowledgeDoc } from "@/lib/knowledge/dfz-knowledge";

export type DocumentStatus = "active" | "cancelled";

export type DocumentVersionItem = {
  id: string;
  title: string;
  effectiveDate: string;
  status: DocumentStatus;
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24);
}

export function getKnowledgeDocumentById(id: string): KnowledgeDoc | null {
  return KNOWLEDGE_BASE.find((doc) => doc.id === id) ?? null;
}

export function getDocumentStatus(doc: KnowledgeDoc): DocumentStatus {
  const hay = normalizeText(`${doc.title} ${doc.content}`);
  if (hay.includes("отменен") || hay.includes("отменена") || hay.includes("отменено")) {
    return "cancelled";
  }
  return "active";
}

export function summarizeDocumentInFiveSentences(doc: KnowledgeDoc): string[] {
  const titleSentence = `${doc.title} е документ в категория „${doc.category}“, източник: ${doc.source}.`;
  const contentSentences = splitSentences(doc.content)
    .filter((s) => !/^\s*(условия|сума|срокове|важно|нужни документи)\s*:/i.test(s))
    .slice(0, 4);

  const summary = [titleSentence, ...contentSentences];
  while (summary.length < 5) {
    summary.push("За конкретен режим вижте актуалния закон и указанията на компетентния орган.");
  }
  return summary.slice(0, 5);
}

export function getDocumentVersionHistory(doc: KnowledgeDoc): DocumentVersionItem[] {
  const baseId = doc.id.replace(/-\d{4}$/, "");
  const normalizedTitle = normalizeText(doc.title);
  const titleTokens = normalizedTitle.split(" ").filter((t) => t.length > 4);

  const versions = KNOWLEDGE_BASE.filter((item) => {
    if (item.id === doc.id) return true;
    if (item.id.replace(/-\d{4}$/, "") === baseId) return true;

    const other = normalizeText(item.title);
    let overlap = 0;
    for (const token of titleTokens.slice(0, 5)) {
      if (other.includes(token)) overlap += 1;
    }
    return overlap >= 3;
  })
    .map((item) => ({
      id: item.id,
      title: item.title,
      effectiveDate: item.effectiveDate,
      status: getDocumentStatus(item),
    }))
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  return versions.slice(0, 6);
}

export function getRelatedDocuments(doc: KnowledgeDoc, limit = 6): KnowledgeDoc[] {
  const docKeywords = new Set(doc.keywords.map((k) => normalizeText(k)));
  return KNOWLEDGE_BASE.filter((item) => item.id !== doc.id)
    .map((item) => {
      let score = item.category === doc.category ? 3 : 0;
      for (const kw of item.keywords) {
        if (docKeywords.has(normalizeText(kw))) score += 2;
      }
      if (item.type === doc.type) score += 1;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
