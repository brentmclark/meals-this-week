import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/current-user";
import { prisma } from "../../../../lib/prisma";
import { toBigIntId } from "../../../../lib/db-format";

export async function GET() {
  const auth = await requireCurrentUser();
  if (auth.error) return auth.error;

  const household = await prisma.household.findUnique({
    where: { id: toBigIntId(auth.user.householdId) },
    select: { name: true }
  });

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      username: auth.user.username,
      displayName: auth.user.displayName,
      role: auth.user.role,
      emailVerifiedAt: auth.user.emailVerifiedAt
    },
    household: {
      id: auth.user.householdId,
      name: household?.name || "Home"
    }
  });
}
