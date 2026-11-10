import "server-only"

/**
 * Sends a transactional email. Plug a provider in here (Resend, SES, Postmark...).
 * In development the message is printed so you can click the link. In production this throws
 * until a provider is configured, so a password reset can never appear to succeed while
 * silently sending nothing.
 */
export async function sendEmail(msg: { to: string; subject: string; text: string }) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[email] to=${msg.to} subject="${msg.subject}"\n${msg.text}\n`)
    return
  }
  throw new Error("No email provider configured. Implement sendEmail in lib/email.ts before enabling email flows in production.")
}
