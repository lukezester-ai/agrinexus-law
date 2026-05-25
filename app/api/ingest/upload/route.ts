import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { extractPdfText } from "@/lib/rag/content/pdf-parser";
import { chunkText, sha256 } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embeddings";
import {
  isR2Configured,
  putPublicDocumentObject,
  sha256Buffer,
} from "@/lib/storage/r2";

export async function POST(req: Request) {
  if (!isIngestAdminAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const institution = formData.get("institution") as string;
    const category = formData.get("category") as string;
    const docType = formData.get("docType") as string;
    const effectiveDate = formData.get("effectiveDate") as string;

    if (!file || !title) {
      return Response.json({ error: "Липсва файл или заглавие." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: "Supabase не е конфигуриран." }, { status: 503 });
    }

    // 1. Четене на файла и извличане на текст
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentHash = sha256Buffer(bytes);
    const sourceUrl = `uploaded:${contentHash}`;
    const institutionNorm = (institution && String(institution).trim()) || "—";
    const categoryNorm =
      (category && String(category).trim()) || "Нормативни актове";
    const docTypeNorm = (docType && String(docType).trim()) || "regulation";

    const text = await extractPdfText(bytes);
    if (!text.trim()) {
      return Response.json({ error: "Не успяхме да извлечем текст от файла. Може би е сканиран като изображение?" }, { status: 400 });
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return Response.json({ error: "Текстът е празен след чънкване." }, { status: 400 });
    }

    // 2. Създаване на запис в public_documents (storage_path се обновява след R2 при успех)
    const docInsert = await supabase
      .from("public_documents")
      .insert({
        title,
        institution: institutionNorm,
        category: categoryNorm,
        doc_type: docTypeNorm,
        effective_date: effectiveDate || null,
        status: "active",
        source_url: sourceUrl,
        storage_path: "pending",
        content_hash: contentHash,
      })
      .select("id")
      .single();

    if (docInsert.error) {
      const msg = docInsert.error.message || "";
      if (/duplicate|unique/i.test(msg)) {
        return Response.json(
          {
            error:
              "Този файл вече е качен (съвпада content hash / source_url).",
          },
          { status: 409 },
        );
      }
      return Response.json(
        { error: `Грешка при запис на документа: ${msg}` },
        { status: 500 },
      );
    }

    const docId = docInsert.data.id;

    // 3. Подготовка за embeddings
    const pendingChunks = [];
    for (const ch of chunks) {
      const hash = await sha256(`${docId}|${ch.index}|${ch.text}`);
      pendingChunks.push({
        source_type: "public_document",
        source_id: docId,
        chunk_index: ch.index,
        title,
        category: categoryNorm,
        doc_type: docTypeNorm,
        source_name: institutionNorm,
        effective_date: effectiveDate || null,
        content: ch.text,
        content_hash: hash,
        metadata: {},
      });
    }

    // 4. Генериране на векторни embeddings (в партиди за защита от лимити)
    const BATCH_SIZE = 32;
    let chunksCreated = 0;

    for (let i = 0; i < pendingChunks.length; i += BATCH_SIZE) {
      const batch = pendingChunks.slice(i, i + BATCH_SIZE);
      const inputs = batch.map(p => `${p.title}\n\n${p.content}`);
      const embeddings = await embedBatch(inputs);

      const rows = batch.map((p, idx) => ({
        ...p,
        embedding: embeddings[idx] as unknown as string,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from("knowledge_chunks")
        .upsert(rows, { onConflict: "source_type,source_id,chunk_index" });

      if (upsertErr) {
        throw new Error(`Грешка при запазване на парчета: ${upsertErr.message}`);
      }
      chunksCreated += rows.length;
    }

    let r2Stored = false;
    if (isR2Configured()) {
      try {
        const objectKey = await putPublicDocumentObject({
          docId,
          filename: file.name,
          bytes,
          contentType: file.type || "application/pdf",
        });
        const { error: r2MetaErr } = await supabase
          .from("public_documents")
          .update({
            storage_path: objectKey,
            updated_at: new Date().toISOString(),
          })
          .eq("id", docId);
        if (r2MetaErr) {
          console.error("R2: failed to update public_documents row:", r2MetaErr);
        } else {
          r2Stored = true;
        }
      } catch (r2Err) {
        console.error("R2 upload failed:", r2Err);
      }
    }

    return Response.json({
      success: true,
      docId,
      chunksCreated,
      r2Stored,
    });

  } catch (err) {
    console.error("Upload API error:", err);
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
