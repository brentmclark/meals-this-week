import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateConfiguredUser } from "../../../../lib/auth-users";
import { setAuthCookie, passcodeHash, verifyPassword } from "../../../../lib/auth";
import { ensureDefaultHousehold, ensureHouseholdUser } from "../../../../lib/household";
import { prisma } from "../../../../lib/prisma";
import { toNumberId } from "../../../../lib/db-format";
import { checkRateLimit } from "../../../../lib/rate-limit";
import { getRequestIp } from "../../../../lib/request";

const schema = z.object({
  identifier: z.string().trim().min(1).optional(),
  passcode: z.string().min(4)
});

export async function POST(request) {
  const ip = getRequestIp(request);
  const ipLimit = checkRateLimit({ key: `login:ip:${ip}`, limit: 25, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const identifier = parsed.data.identifier?.trim().toLowerCase() || "";
  if (identifier) {
    const userLimit = checkRateLimit({
      key: `login:id:${identifier}`,
      limit: 12,
      windowMs: 10 * 60 * 1000
    });
    if (!userLimit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (identifier) {
    const localUser = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
      select: {
        id: true,
        householdId: true,
        passwordHash: true,
        emailVerifiedAt: true,
        failedLoginAttempts: true,
        lockedUntil: true
      }
    });

    if (localUser) {
      if (localUser.lockedUntil && localUser.lockedUntil > new Date()) {
        return NextResponse.json(
          {
            error: "account_locked",
            retryAt: localUser.lockedUntil.toISOString()
          },
          { status: 423 }
        );
      }

      if (localUser.passwordHash && verifyPassword(parsed.data.passcode, localUser.passwordHash)) {
        if (!localUser.emailVerifiedAt) {
          return NextResponse.json({ error: "email_not_verified" }, { status: 403 });
        }

        await prisma.user.update({
          where: { id: localUser.id },
          data: { failedLoginAttempts: 0, lockedUntil: null }
        });
        setAuthCookie(toNumberId(localUser.id), toNumberId(localUser.householdId));
        return NextResponse.json({ ok: true, mode: "db-user" });
      }

      const nextAttempts = localUser.failedLoginAttempts + 1;
      const shouldLock = nextAttempts >= 5;
      await prisma.user.update({
        where: { id: localUser.id },
        data: {
          failedLoginAttempts: nextAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null
        }
      });
      return NextResponse.json({ error: shouldLock ? "account_locked" : "unauthorized" }, { status: 401 });
    }
  }

  let auth;
  try {
    auth = await authenticateConfiguredUser(identifier, parsed.data.passcode);
  } catch (error) {
    console.error("Auth configuration error:", error);
    return NextResponse.json({ error: "auth_config_invalid" }, { status: 500 });
  }

  if (auth.mode === "multi-user") {
    if (!auth.ok) {
      const error = auth.reason === "missing-identifier" ? "identifier_required" : "unauthorized";
      return NextResponse.json({ error }, { status: 401 });
    }

    const { householdId, userId } = await ensureHouseholdUser({
      email: auth.user.email,
      username: auth.user.login,
      displayName: auth.user.name,
      role: auth.user.role
    });
    setAuthCookie(userId, householdId);
    return NextResponse.json({ ok: true, mode: "multi-user" });
  }

  const hash = passcodeHash(parsed.data.passcode);
  const expected = process.env.FAMILY_PASSCODE_HASH;
  if (!expected || hash !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { householdId, userId } = await ensureDefaultHousehold();
  setAuthCookie(userId, householdId);

  return NextResponse.json({ ok: true, mode: "single-passcode" });
}
