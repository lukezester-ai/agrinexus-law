import { getKnowledgeDocumentById, getRelatedDocuments } from "@/lib/knowledge/document-detail";

export async function POST(req: Request) {
  const body = await req.json();
  const { id } = body;

  if (!id || typeof id !== "string") {
    return Response.json({ error: "Missing document ID" }, { status: 400 });
  }

  const doc = getKnowledgeDocumentById(id);
  if (!doc) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  const related = getRelatedDocuments(doc, 1);
  const result = related.length > 0 ? related[0] : null;

  return Response.json({ related: result ? { id: result.id, title: result.title } : null });
}
