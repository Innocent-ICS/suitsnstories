import { Resend } from "resend";

// Initialize Resend client — will be null if API key is not set (development)
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender — use Resend's free test domain until custom domain is set up
const FROM_EMAIL = process.env.EMAIL_FROM || "Suits & Stories <onboarding@resend.dev>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a transactional email via Resend.
 * Silently fails in development if RESEND_API_KEY is not set (logs to console instead).
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL-DEV] Body preview: ${text || html.substring(0, 200)}...`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[EMAIL] Send failed:", JSON.stringify(error));
      return false;
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Unexpected error:", error);
    return false;
  }
}
