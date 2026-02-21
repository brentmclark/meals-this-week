import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "../../../../lib/auth";
import { createEmailVerificationForUser } from "../../../../lib/auth-tokens";
import { createHouseholdLocalUser, ensureHouseholdId } from "../../../../lib/household";
import { consumeInviteForSignup, validateInviteForEmail } from "../../../../lib/invites";
import { prisma } from "../../../../lib/prisma";
import { checkRateLimit } from "../../../../lib/rate-limit";
import { getRequestIp } from "../../../../lib/request";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(80),
  passcode: z.string().min(8).max(128),
  inviteToken: z.string().trim().min(10).optional()
});

export async function POST(request) {
  const ip = getRequestIp(request);
  const limit = checkRateLimit({ key: `signup:${ip}`, limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const username = parsed.data.username.toLowerCase();
  const email = parsed.data.email.toLowerCase();
  const displayName = parsed.data.displayName;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true, username: true, email: true }
  });

  if (existing) {
    const error = existing.username === username ? "username_taken" : "email_taken";
    return NextResponse.json({ error }, { status: 409 });
  }

  const localUserCount = await prisma.user.count({ where: { passwordHash: { not: null } } });
  let role = localUserCount === 0 ? "manager" : "member";
  let householdId = await ensureHouseholdId();

  if (parsed.data.inviteToken) {
    const inviteCheck = await validateInviteForEmail({
      token: parsed.data.inviteToken,
      email
    });
    if (!inviteCheck.ok) {
      return NextResponse.json(
        { error: inviteCheck.error === "email_mismatch" ? "invite_email_mismatch" : "invalid_invite" },
        { status: 400 }
      );
    }
    role = inviteCheck.role;
    householdId = inviteCheck.householdId;
  }

  const passwordHash = hashPassword(parsed.data.passcode);
  const created = await createHouseholdLocalUser({
    householdId,
    username,
    email,
    displayName,
    role,
    passwordHash
  });

  if (parsed.data.inviteToken) {
    const invite = await consumeInviteForSignup({
      token: parsed.data.inviteToken,
      email,
      newUserId: created.userId
    });
    if (!invite.ok) return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
  }

  const verification = await createEmailVerificationForUser(created.userId, email);
  return NextResponse.json({
    ok: true,
    requiresVerification: true,
    verificationUrl: process.env.NODE_ENV === "production" ? undefined : verification.verificationUrl
  });
}
