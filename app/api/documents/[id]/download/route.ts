import { getKnowledgeDocumentById } from "@/lib/knowledge/document-detail";
import {
	getPublicDocumentById,
	getPublicDocumentRecord,
	isPublicDocumentId,
} from "@/lib/knowledge/public-documents-search";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

const STORAGE_BUCKET = "agro-docs";

function safeDownloadName(title: string, ext: string): string {
	const base = title
		.replace(/[^\w\s\u0400-\u04FF.-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 80);
	return `${base || "document"}.${ext}`;
}

function mimeForExt(ext: string): string {
	switch (ext) {
		case "pdf":
			return "application/pdf";
		case "html":
		case "htm":
			return "text/html; charset=utf-8";
		case "doc":
			return "application/msword";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		default:
			return "application/octet-stream";
	}
}

export async function GET(_: Request, context: Params) {
	const { id } = await context.params;

	if (isPublicDocumentId(id)) {
		const record = await getPublicDocumentRecord(id);
		if (record?.storage_path) {
			const supabase = getSupabaseAdmin();
			if (supabase) {
				const { data, error } = await supabase.storage
					.from(STORAGE_BUCKET)
					.download(record.storage_path);
				if (!error && data) {
					const ext =
						record.storage_path.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "bin";
					const filename = safeDownloadName(record.title, ext);
					return new Response(data, {
						status: 200,
						headers: {
							"Content-Type": mimeForExt(ext),
							"Content-Disposition": `attachment; filename="${filename}"`,
							"Cache-Control": "private, max-age=3600",
						},
					});
				}
			}
		}
	}

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
