import { getSupabaseAdmin } from "@/lib/supabase";

type ChatRow = {
  id: string;
  character_id: string;
  user_message: string;
  assistant_message: string;
  created_at: string;
};

function isAuthorized(req: Request): boolean {
  const required = process.env.LEARNING_CRON_TOKEN?.trim();
  if (!required) return false;
  const got = req.headers.get("x-learning-token")?.trim();
  const auth = req.headers.get("authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean((got && got === required) || (bearer && bearer === required));
}

function toCategoryFromCharacter(characterId: string): string {
  if (characterId === "elena") return "Процедури";
  if (characterId === "boris") return "Екосхеми";
  if (characterId === "viktoria") return "Директни плащания";
  return "Практически насоки";
}

function extractKeywords(text: string): string[] {
  const stop = new Set(["за", "на", "с", "и", "в", "по", "как", "да", "ли", "от", "при", "че"]);
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .split(/\s+/)
        .map(x => x.trim())
        .filter(x => x.length >= 4 && !stop.has(x))
        .slice(0, 8)
    )
  );
}

function titleFromQuestion(question: string): string {
  const compact = question.replace(/\s+/g, " ").trim();
  if (compact.length <= 90) return compact;
  return `${compact.slice(0, 87)}...`;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const limit = Math.min(Math.max(Number(new URL(req.url).searchParams.get("limit") || 100), 1), 500);

  const rows = await supabase
    .from("chat_logs")
    .select("id, character_id, user_message, assistant_message, created_at")
    .eq("feedback", 1)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (rows.error) {
    return Response.json({ error: rows.error.message }, { status: 500 });
  }

  const items = ((rows.data || []) as ChatRow[]).map((row) => ({
    source_chat_log_id: row.id,
    title: titleFromQuestion(row.user_message),
    category: toCategoryFromCharacter(row.character_id),
    type: "learned_rule",
    content: row.assistant_message,
    keywords: extractKeywords(row.user_message),
    source: "User feedback loop",
    effective_date: new Date().toISOString().slice(0, 10),
    quality_score: 1.0,
    is_active: true,
  }));

  if (items.length === 0) return Response.json({ ok: true, scanned: 0, learned: 0 });

  const upsert = await supabase
    .from("knowledge_learned_items")
    .upsert(items, { onConflict: "source_chat_log_id" });

  if (upsert.error) {
    return Response.json({ error: upsert.error.message }, { status: 500 });
  }

  return Response.json({ ok: true, scanned: items.length, learned: items.length });
}
