import { NextResponse } from "next/server";
import { z } from "zod";
import { isManagerRole, requireCurrentUser } from "../../../../lib/current-user";
import { createInvite, listInvites } from "../../../../lib/invites";

const schema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["member", "manager"]).default("member")
});

export async function GET() {
  const auth = await requireCurrentUser();
  if (auth.error) return auth.error;

  const items = await listInvites(auth.user.householdId);
  return NextResponse.json({ items });
}

export async function POST(request) {
  const auth = await requireCurrentUser();
  if (auth.error) return auth.error;
  if (!isManagerRole(auth.user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const invite = await createInvite({
    householdId: auth.user.householdId,
    email: parsed.data.email,
    role: parsed.data.role,
    invitedById: auth.user.id
  });

  return NextResponse.json(
    {
      ok: true,
      inviteUrl: process.env.NODE_ENV === "production" ? undefined : invite.inviteUrl,
      expiresAt: invite.expiresAt.toISOString()
    },
    { status: 201 }
  );
}
