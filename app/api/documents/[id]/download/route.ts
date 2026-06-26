import { getKnowledgeDocumentById } from "@/lib/knowledge/document-detail";
import { getPublicDocumentById } from "@/lib/knowledge/public-documents-search";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;
  const doc = getKnowledgeDocumentById(id) ?? (await getPublicDocumentById(id));

  if (!doc) {
    return Response.json({ error: "Документът не е намерен." }, { status: 404 });
  }

  if (doc.sourceUrl?.startsWith("http")) {
    return Response.redirect(doc.sourceUrl, 302);
  }

  const body = [
    doc.title,
    `Категория: ${doc.category}`,
    `Тип: ${doc.type}`,
    "Статус: актуален",
    `Източник: ${doc.source}`,
    `Дата: ${doc.effectiveDate}`,
    "",
    doc.content,
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${doc.id}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
