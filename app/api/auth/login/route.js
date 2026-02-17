import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDefaultHousehold } from "../../../../lib/household";
import { passcodeHash, setAuthCookie } from "../../../../lib/auth";

const schema = z.object({ passcode: z.string().min(4) });

export async function POST(request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const hash = passcodeHash(parsed.data.passcode);
  const expected = process.env.FAMILY_PASSCODE_HASH;
  if (!expected || hash !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { householdId, userId } = await ensureDefaultHousehold();
  setAuthCookie(userId, householdId);

  return NextResponse.json({ ok: true });
}
