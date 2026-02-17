import { NextResponse } from "next/server";
import { z } from "zod";
import { toBigIntId, toISODateOnly, toNumberId } from "../../../lib/db-format";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/session";

const createSchema = z.object({
  mealName: z.string().min(1).max(140),
  note: z.string().max(300).nullable().optional()
});

export async function GET() {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const items = await prisma.stagedMeal.findMany({
    where: { householdId: toBigIntId(auth.session.householdId) },
    take: 300
  });
  items.sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    if (a.preferredDate && b.preferredDate) return a.preferredDate - b.preferredDate;
    if (a.preferredDate && !b.preferredDate) return -1;
    if (!a.preferredDate && b.preferredDate) return 1;
    return b.createdAt - a.createdAt;
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: toNumberId(item.id),
      meal_name: item.mealName,
      preferred_date: toISODateOnly(item.preferredDate),
      not_before_date: toISODateOnly(item.notBeforeDate),
      note: item.note,
      status: item.status,
      created_at: item.createdAt.toISOString()
    }))
  });
}

export async function POST(request) {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const item = parsed.data;

  const created = await prisma.stagedMeal.create({
    data: {
      householdId: toBigIntId(auth.session.householdId),
      mealName: item.mealName,
      preferredDate: null,
      notBeforeDate: null,
      note: item.note || null,
      createdBy: toBigIntId(auth.session.userId)
    }
  });

  return NextResponse.json(
    {
      id: toNumberId(created.id),
      meal_name: created.mealName,
      preferred_date: toISODateOnly(created.preferredDate),
      not_before_date: toISODateOnly(created.notBeforeDate),
      note: created.note,
      status: created.status,
      created_at: created.createdAt.toISOString()
    },
    { status: 201 }
  );
}
