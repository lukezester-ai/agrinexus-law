import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "30");
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 30, 1), 200);

  const query = supabase
    .from("public_documents")
    .select("id,title,institution,category,doc_type,status,source_url,storage_path,effective_date,last_synced_at")
    .order("effective_date", { ascending: false, nullsFirst: false })
    .order("last_synced_at", { ascending: false })
    .limit(limit);

  const institution = url.searchParams.get("institution")?.trim();
  const category = url.searchParams.get("category")?.trim();
  if (institution) query.eq("institution", institution);
  if (category) query.eq("category", category);

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}
