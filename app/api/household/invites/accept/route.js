import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "../../../../../lib/current-user";
import { acceptInviteForExistingUser } from "../../../../../lib/invites";
import { setAuthCookie } from "../../../../../lib/auth";

const schema = z.object({
  token: z.string().trim().min(10)
});

export async function POST(request) {
  const auth = await requireCurrentUser();
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const accepted = await acceptInviteForExistingUser({
    token: parsed.data.token,
    userId: auth.user.id,
    userEmail: auth.user.email
  });
  if (!accepted.ok) {
    const error = accepted.error === "email_mismatch" ? "invite_email_mismatch" : "invalid_invite";
    return NextResponse.json({ error }, { status: 400 });
  }

  setAuthCookie(auth.user.id, accepted.householdId);
  return NextResponse.json({ ok: true });
}
