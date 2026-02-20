import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateConfiguredUser } from "../../../../lib/auth-users";
import { setAuthCookie, passcodeHash } from "../../../../lib/auth";
import { ensureDefaultHousehold, ensureHouseholdUser } from "../../../../lib/household";

const schema = z.object({
  identifier: z.string().trim().min(1).optional(),
  passcode: z.string().min(4)
});

export async function POST(request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let auth;
  try {
    auth = await authenticateConfiguredUser(parsed.data.identifier, parsed.data.passcode);
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
