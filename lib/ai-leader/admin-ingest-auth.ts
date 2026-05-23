/**
 * Споделена защита за админ ingest / RAG reindex / PDF upload.
 * Задайте INGEST_ADMIN_TOKEN в `.env.local` и подавайте същата стойност като
 * header `x-ingest-token` или `Authorization: Bearer <token>`.
 */
export function isIngestAdminAuthorized(req: Request): boolean {
  const required = process.env.INGEST_ADMIN_TOKEN?.trim();
  if (!required) return false;
  const headerToken =
    req.headers.get("x-ingest-token")?.trim() ||
    req.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  return Boolean(headerToken && headerToken === required);
}
