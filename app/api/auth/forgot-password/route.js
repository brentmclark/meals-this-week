import { NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordResetForUser } from "../../../../lib/auth-tokens";
import { prisma } from "../../../../lib/prisma";
import { checkRateLimit } from "../../../../lib/rate-limit";
import { getRequestIp } from "../../../../lib/request";

const schema = z.object({
  identifier: z.string().trim().min(1)
});

export async function POST(request) {
  const ip = getRequestIp(request);
  const limit = checkRateLimit({ key: `forgot:${ip}`, limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const identifier = parsed.data.identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    select: { id: true, email: true, passwordHash: true }
  });

  if (!user?.passwordHash) return NextResponse.json({ ok: true });

  const result = await createPasswordResetForUser(Number(user.id), user.email);
  return NextResponse.json({
    ok: true,
    resetUrl: process.env.NODE_ENV === "production" ? undefined : result.resetUrl
  });
}
