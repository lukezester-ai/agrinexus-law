import { Resend } from "resend";

const RESEND_FROM = process.env.RESEND_FROM?.trim() || "AgriNexus.Law <onboarding@resend.dev>";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function welcomeEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="padding:48px 40px 32px;text-align:center;background:linear-gradient(135deg,#059669,#0d9488)">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff">Добре дошли в AgriNexus.Law</h1>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1d1d1f">Здравейте${name ? `, ${name}` : ""},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1d1d1f">Благодарим Ви за регистрацията в AgriNexus.Law — вашият AI асистент за български фермери.</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background:#f0fdf4;border-radius:12px;margin:24px 0">
            <tr><td style="font-size:14px;color:#166534;line-height:1.5">
              <strong>Какво можете да правите:</strong>
              <ul style="margin:8px 0 0;padding-left:20px">
                <li>Търсете в официални документи на ДФЗ и МЗХ</li>
                <li>Използвайте AI чат с трима специалиста</li>
                <li>Преглеждайте договори с AI анализ</li>
                <li>Следете срокове и субсидии</li>
                <li>Управлявайте стопанството си с ERP модулите</li>
              </ul>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:16px 0">
              <a href="https://www.agrinexuslaw.com/search" style="display:inline-block;padding:14px 32px;background:#059669;color:#fff;text-decoration:none;border-radius:980px;font-size:15px;font-weight:600">Започнете да търсите</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e5e5e5">
          <p style="margin:0;font-size:12px;color:#86868b;line-height:1.4">AgriNexus.Law — AI асистенти за български фермери.<br>Ако не сте създавали този акаунт, моля игнорирайте този имейл.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, name?: string): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not configured" };

  try {
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [to.trim().toLowerCase()],
      subject: "Добре дошли в AgriNexus.Law",
      html: welcomeEmailHtml(name || ""),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Unknown error" };
  }
}
