import { NextResponse } from "next/server";
import { toBigIntId, toISODateOnly, toNumberId } from "../../../lib/db-format";
import { buildWeek, parseISODate, startOfWeek, toISODate } from "../../../lib/date";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/session";

export async function GET(request) {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const inputStart = url.searchParams.get("start");
  const weekStart = inputStart || toISODate(startOfWeek(new Date(), 0));
  const days = buildWeek(weekStart);

  const weekRows = await prisma.weekDay.findMany({
    where: {
      householdId: toBigIntId(auth.session.householdId),
      dayDate: {
        gte: parseISODate(days[0]),
        lte: parseISODate(days[6])
      }
    },
    orderBy: { dayDate: "asc" },
    include: { mealEntry: { include: { thawRule: true } } }
  });

  const byDate = new Map();
  for (const d of days) {
    byDate.set(d, {
      date: d,
      nightType: "normal",
      mealEntryId: null,
      mealName: "",
      notes: "",
      thawLabel: null,
      thawLeadDays: null
    });
  }

  for (const row of weekRows) {
    const dateKey = toISODateOnly(row.dayDate);
    byDate.set(dateKey, {
      date: dateKey,
      nightType: row.nightType,
      mealEntryId: row.mealEntry ? toNumberId(row.mealEntry.id) : null,
      mealName: row.mealEntry?.mealName || "",
      notes: row.mealEntry?.notes || "",
      thawLabel: row.mealEntry?.thawReminderLabel || row.mealEntry?.thawRule?.name || null,
      thawLeadDays: row.mealEntry?.thawLeadDays ?? row.mealEntry?.thawRule?.leadDays ?? null
    });
  }

  const stagedWithDate = await prisma.stagedMeal.findMany({
    where: {
      householdId: toBigIntId(auth.session.householdId),
      status: "staged",
      preferredDate: { not: null }
    },
    orderBy: [{ preferredDate: "asc" }, { createdAt: "desc" }],
    take: 20
  });
  const stagedWithoutDate =
    stagedWithDate.length < 20
      ? await prisma.stagedMeal.findMany({
          where: {
            householdId: toBigIntId(auth.session.householdId),
            status: "staged",
            preferredDate: null
          },
          orderBy: { createdAt: "desc" },
          take: 20 - stagedWithDate.length
        })
      : [];
  const staged = [...stagedWithDate, ...stagedWithoutDate].map((item) => ({
    id: toNumberId(item.id),
    meal_name: item.mealName,
    preferred_date: toISODateOnly(item.preferredDate),
    not_before_date: toISODateOnly(item.notBeforeDate),
    note: item.note
  }));

  return NextResponse.json({ weekStart, days: Array.from(byDate.values()), staged });
}
