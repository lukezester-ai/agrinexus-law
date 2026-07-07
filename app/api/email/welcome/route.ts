import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, name } = (await request.json()) as { email?: string; name?: string };
    if (!email?.trim()) {
      return Response.json({ ok: false, error: "Email is required" }, { status: 400 });
    }
    const result = await sendWelcomeEmail(email.trim(), name?.trim());
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error || "Failed to send" }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
