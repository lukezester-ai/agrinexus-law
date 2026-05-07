import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { waitlistRateLimit, checkRateLimit, extractClientIp } from "@/lib/utils/rate-limit";
import { mkdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const RESEND_FROM =
  process.env.RESEND_FROM?.trim() || "AgriNexus.Law <onboarding@resend.dev>";

async function storeWaitlistFallback(payload: {
  email: string;
  farm_type?: string | null;
  farm_size?: number | null;
  region?: string | null;
  ip_address: string;
}) {
  try {
    const dir = resolve(process.cwd(), ".local");
    const file = resolve(dir, "waitlist-fallback.jsonl");
    await mkdir(dir, { recursive: true });
    await appendFile(
      file,
      `${JSON.stringify({ ...payload, stored_at: new Date().toISOString() })}\n`,
      "utf-8"
    );
    return true;
  } catch (e) {
    console.error("Fallback waitlist store failed:", e);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const ip = extractClientIp(req);
    const rateLimitResult = await checkRateLimit(waitlistRateLimit, ip);

    if (!rateLimitResult.success) {
      return Response.json(
        { error: "Твърде много опити. Опитай след 10 минути." },
        { status: 429 }
      );
    }

    const { email, farm_type, farm_size, region } = await req.json();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return Response.json(
        { error: "Невалиден имейл адрес" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const row = {
      email: normalizedEmail,
      farm_type: farm_type || null,
      farm_size: farm_size || null,
      region: region || null,
      ip_address: ip,
    };

    const supabaseAdmin = getSupabaseAdmin();
    let persisted = false;

    if (supabaseAdmin) {
      const existingRes = await supabaseAdmin
        .from("waitlist")
        .select("email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingRes.error) {
        console.error("Supabase existing-check error:", existingRes.error);
      } else if (existingRes.data) {
        return Response.json({
          success: true,
          message: "Вече си в списъка! Ще се чуем скоро.",
        });
      }

      const { error: dbError } = await supabaseAdmin.from("waitlist").insert(row);
      if (!dbError) {
        persisted = true;
      } else {
        // Unique violation -> treat as already registered success.
        if ((dbError as { code?: string }).code === "23505") {
          return Response.json({
            success: true,
            message: "Вече си в списъка! Ще се чуем скоро.",
          });
        }
        console.error("Supabase insert error:", dbError);
      }
    }

    if (!persisted) {
      const fallbackStored = await storeWaitlistFallback(row);
      if (!fallbackStored) {
        return Response.json(
          { error: "Не успяхме да запишем регистрацията. Опитай пак по-късно." },
          { status: 500 },
        );
      }
    }

    if (resend) {
      try {
        await resend.emails.send({
          from: RESEND_FROM,
          to: normalizedEmail,
          subject: "Добре дошъл в AgriNexus.Law! 🌾",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #14b8a6, #0d9488); border-radius: 12px; line-height: 50px; color: white; font-size: 24px; font-weight: 600;">A</div>
                <h1 style="margin: 16px 0 8px; color: #1c1917; font-size: 24px;">Здравей и добре дошъл!</h1>
                <p style="color: #57534e; margin: 0;">Радваме се, че си с нас.</p>
              </div>

              <div style="background: #FFFBF3; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; line-height: 1.6;">Току-що се записа в waitlist на <strong>AgriNexus.Law</strong> - твоят екип от AI специалисти за всичко свързано със земеделие.</p>
                <p style="margin: 0 0 12px; line-height: 1.6;">Какво следва?</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>Елена</strong> — право, ДФЗ и срокове</li>
                  <li><strong>Борис</strong> — култури, почва и практики на полето</li>
                  <li><strong>Виктория</strong> — сметки, прогнози и подредени числа</li>
                </ul>
              </div>

              <div style="margin-bottom: 24px;">
                <p style="line-height: 1.6;">Първите 100 фермери получават достъп <strong>безплатно за първата година</strong>. Ще те потърсим в следващите 24-48 часа.</p>
                <p style="line-height: 1.6;">Ако имаш въпроси, просто отговори на този имейл.</p>
              </div>

              <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, #0f766e, #14b8a6); border-radius: 12px; color: white;">
                <p style="margin: 0 0 8px; font-size: 18px;">🌾 Добре дошъл в семейството</p>
                <p style="margin: 0; opacity: 0.9; font-size: 14px;">Екипът на AgriNexus.Law</p>
              </div>

              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e7e5e4;">
                <p style="font-size: 12px; color: #a8a29e; margin: 0;">© 2026 AgriNexus.Law. Помагаме на българските фермери.</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
      }
    }

    return Response.json({
      success: true,
      message: persisted
        ? "Регистрацията е успешна!"
        : "Регистрацията е приета. Ще потвърдим при следваща синхронизация.",
    });
  } catch (error) {
    console.error("Waitlist error:", error);
    return Response.json(
      { error: "Възникна грешка при регистрацията" },
      { status: 500 }
    );
  }
}
