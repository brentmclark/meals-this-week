import { NextResponse } from "next/server";
import { z } from "zod";
import { consumePasswordResetToken } from "../../../../lib/auth-tokens";
import { hashPassword } from "../../../../lib/auth";
import { checkRateLimit } from "../../../../lib/rate-limit";
import { getRequestIp } from "../../../../lib/request";

const schema = z.object({
  token: z.string().trim().min(10),
  passcode: z.string().min(8).max(128)
});

export async function POST(request) {
  const ip = getRequestIp(request);
  const limit = checkRateLimit({ key: `reset:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const result = await consumePasswordResetToken(parsed.data.token, hashPassword(parsed.data.passcode));
  if (!result.ok) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
