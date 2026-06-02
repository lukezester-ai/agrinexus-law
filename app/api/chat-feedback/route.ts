import { getSupabaseAdmin } from "@/lib/supabase";
import {
  chatFeedbackRateLimit,
  checkRateLimit,
  extractClientIp,
} from "@/lib/utils/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const ip = extractClientIp(req);
    const rateLimitResult = await checkRateLimit(chatFeedbackRateLimit, ip);
    if (!rateLimitResult.success) {
      return Response.json(
        { error: "Too many feedback requests. Try again shortly." },
        { status: 429 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      chatLogId?: string;
      feedback?: number;
    };
    const chatLogId = body.chatLogId?.trim();
    const feedback = Number(body.feedback);
    if (!chatLogId || !UUID_RE.test(chatLogId) || ![1, -1].includes(feedback)) {
      return Response.json({ error: "Invalid payload. chatLogId + feedback(1|-1) required." }, { status: 400 });
    }
    let updateQuery = supabase
      .from("chat_logs")
      .update({ feedback })
      .eq("id", chatLogId);
    if (ip !== "unknown") {
      updateQuery = updateQuery.eq("ip_address", ip);
    }

    const updated = await updateQuery.select("id").single();
    if (updated.error) {
      return Response.json({ error: "Failed to save feedback." }, { status: 404 });
    }

    return Response.json({ ok: true, id: updated.data?.id ?? chatLogId });
  } catch (error) {
    console.error("chat-feedback route error:", error);
    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
