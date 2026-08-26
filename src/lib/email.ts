import "server-only";
import { Resend } from "resend";

/**
 * Contact-form notification email via Resend.
 *
 * Sending is strictly best-effort: if RESEND_API_KEY is unset or Resend returns
 * an error, we log it and carry on. The submission is already committed to the
 * database by that point, so a mail outage must never surface as a failed form
 * for the visitor.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type ContactNotification = {
  name: string;
  email: string;
  message: string;
  receivedAt: Date;
};

export async function sendContactNotification(
  payload: ContactNotification
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";

  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };
  if (!to) return { sent: false, reason: "CONTACT_TO_EMAIL not configured" };

  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [to],
      // Lets you hit Reply in your mail client and answer the visitor directly.
      replyTo: payload.email,
      subject: `Portfolio contact: ${payload.name}`,
      text:
        `New contact form submission\n\n` +
        `Name:    ${payload.name}\n` +
        `Email:   ${payload.email}\n` +
        `Time:    ${payload.receivedAt.toISOString()}\n\n` +
        `${payload.message}\n`,
      html:
        `<div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6;color:#0f172a">` +
        `<h2 style="margin:0 0 16px">New contact form submission</h2>` +
        `<p style="margin:0 0 4px"><strong>Name:</strong> ${safeName}</p>` +
        `<p style="margin:0 0 4px"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>` +
        `<p style="margin:0 0 16px"><strong>Received:</strong> ${payload.receivedAt.toUTCString()}</p>` +
        `<div style="padding:16px;background:#f4f6fa;border-radius:8px;white-space:pre-wrap">${safeMessage}</div>` +
        `</div>`,
    });

    if (result.error) {
      console.error("[email] Resend rejected the send:", result.error);
      return { sent: false, reason: result.error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown error" };
  }
}
