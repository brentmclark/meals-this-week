const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendTransactionalEmail({ to, subject, text }) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Meals This Week <no-reply@example.com>";

  if (!resendKey) {
    console.info(`MAIL (no provider configured) -> ${to} | ${subject}\n${text}`);
    return { delivered: false, provider: "none" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "unknown");
    console.error(`Resend delivery failed (${response.status}): ${details}`);
    return { delivered: false, provider: "resend" };
  }

  return { delivered: true, provider: "resend" };
}
