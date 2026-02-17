import { NextResponse } from "next/server";
import { toBigIntId, toISODateOnly, toNumberId } from "../../../lib/db-format";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/session";

export async function GET(request) {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  const items = await prisma.mealHistory.findMany({
    where: {
      householdId: toBigIntId(auth.session.householdId),
      ...(q ? { mealName: { contains: q, mode: "insensitive" } } : {})
    },
    orderBy: { occurredOn: "desc" },
    take: 250
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: toNumberId(item.id),
      meal_name: item.mealName,
      occurred_on: toISODateOnly(item.occurredOn)
    }))
  });
}
