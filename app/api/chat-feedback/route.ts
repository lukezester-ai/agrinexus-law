import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
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
    if (!chatLogId || ![1, -1].includes(feedback)) {
      return Response.json({ error: "Invalid payload. chatLogId + feedback(1|-1) required." }, { status: 400 });
    }

    const updated = await supabase
      .from("chat_logs")
      .update({ feedback })
      .eq("id", chatLogId)
      .select("id")
      .single();
    if (updated.error) {
      return Response.json({ error: "Failed to save feedback." }, { status: 500 });
    }

    return Response.json({ ok: true, id: updated.data?.id ?? chatLogId });
  } catch (error) {
    console.error("chat-feedback route error:", error);
    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
