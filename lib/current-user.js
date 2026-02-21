import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { requireSession } from "./session";
import { toBigIntId, toNumberId } from "./db-format";

export function isManagerRole(role) {
  return role === "manager" || role === "admin";
}

export async function requireCurrentUser() {
  const auth = requireSession();
  if (auth.error) return { error: auth.error };

  const user = await prisma.user.findFirst({
    where: {
      id: toBigIntId(auth.session.userId),
      householdId: toBigIntId(auth.session.householdId)
    },
    select: {
      id: true,
      householdId: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      emailVerifiedAt: true
    }
  });

  if (!user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  return {
    session: auth.session,
    user: {
      ...user,
      id: toNumberId(user.id),
      householdId: toNumberId(user.householdId)
    }
  };
}
