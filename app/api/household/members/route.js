import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/current-user";
import { prisma } from "../../../../lib/prisma";
import { toBigIntId, toNumberId } from "../../../../lib/db-format";

export async function GET() {
  const auth = await requireCurrentUser();
  if (auth.error) return auth.error;

  const members = await prisma.user.findMany({
    where: { householdId: toBigIntId(auth.user.householdId) },
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    items: members.map((member) => ({
      id: toNumberId(member.id),
      email: member.email,
      username: member.username,
      displayName: member.displayName,
      role: member.role,
      emailVerifiedAt: member.emailVerifiedAt ? member.emailVerifiedAt.toISOString() : null,
      createdAt: member.createdAt.toISOString()
    }))
  });
}
