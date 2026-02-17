import { NextResponse } from "next/server";
import { toBigIntId, toNumberId } from "../../../lib/db-format";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/session";

export async function GET() {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const rules = await prisma.thawRule.findMany({
    where: { householdId: toBigIntId(auth.session.householdId) },
    orderBy: { leadDays: "asc" }
  });

  return NextResponse.json({
    items: rules.map((rule) => ({
      id: toNumberId(rule.id),
      name: rule.name,
      lead_days: rule.leadDays
    }))
  });
}
