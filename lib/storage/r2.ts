import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "crypto";

/** SHA-256 hex digest на байтовете (идентичност на файла за `public_documents.content_hash`). */
export function sha256Buffer(buf: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(buf)).digest("hex");
}

let cachedClient: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim(),
  );
}

function getR2S3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
  return cachedClient;
}

function safeFileSegment(name: string): string {
  const base = name.trim().replace(/[^a-zA-Z0-9._-]+/g, "_");
  return (base || "document").slice(0, 180);
}

/**
 * Качва оригиналния файл в R2 под префикс `public-documents/{docId}/`.
 * Връща object key (за `public_documents.storage_path`).
 */
export async function putPublicDocumentObject(params: {
  docId: string;
  filename: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME!.trim();
  const key = `public-documents/${params.docId}/${safeFileSegment(params.filename)}`;
  await getR2S3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(params.bytes),
      ContentType: params.contentType,
    }),
  );
  return key;
}
