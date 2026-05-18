/**
 * Email templates for Suits & Stories platform.
 * These return plain HTML strings — simple and framework-independent.
 * Can be upgraded to React Email templates later.
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #0f172a;
`;

const buttonStyle = `
  display: inline-block;
  background: #9333ea;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
`;

function wrap(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="background: #f8fafc; margin: 0; padding: 0;">
        <div style="${baseStyles}">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 20px; font-weight: 600; color: #9333ea;">Suits & Stories</span>
          </div>
          ${content}
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} Suits & Stories. Narrative clarity for the rooms that matter.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function welcomeEmail(name: string): { subject: string; html: string; text: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "Welcome to Suits & Stories",
    html: wrap(`
      <h2 style="font-size: 24px; margin: 0 0 16px;">Welcome, ${firstName}.</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">
        You've joined a platform built for founders, professionals, and executives 
        who take narrative seriously.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">
        Here's what you can do next:
      </p>
      <ul style="font-size: 15px; line-height: 1.8; color: #475569; padding-left: 20px;">
        <li><strong>Complete your profile</strong> — helps us personalize your experience</li>
        <li><strong>Browse courses</strong> — self-paced pitch coaching curriculum</li>
        <li><strong>Book a diagnostic</strong> — get expert analysis of your pitch</li>
      </ul>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="${buttonStyle}">
          Go to Dashboard
        </a>
      </div>
    `),
    text: `Welcome to Suits & Stories, ${firstName}!\n\nYou've joined a platform built for founders and executives who take narrative seriously.\n\nGet started: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
  };
}

export function inquiryReceivedEmail(name: string): { subject: string; html: string; text: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "We received your inquiry — Suits & Stories",
    html: wrap(`
      <h2 style="font-size: 24px; margin: 0 0 16px;">Thank you, ${firstName}.</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">
        We've received your inquiry and will respond within 24-48 hours.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">
        In the meantime, you can explore our methodology and see how we help 
        founders communicate with precision and authority.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/methodology" style="${buttonStyle}">
          Our Methodology
        </a>
      </div>
    `),
    text: `Thank you, ${firstName}.\n\nWe've received your inquiry and will respond within 24-48 hours.\n\nLearn more: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/methodology`,
  };
}
