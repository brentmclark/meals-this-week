import { NextResponse } from "next/server";
import { toBigIntId, toNumberId } from "../../../../lib/db-format";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/session";

export async function GET() {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const now = new Date();
  const from = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const reminders = await prisma.reminder.findMany({
    where: {
      householdId: toBigIntId(auth.session.householdId),
      status: "pending",
      dueAt: { gte: from, lte: to }
    },
    orderBy: { dueAt: "asc" },
    take: 40
  });

  return NextResponse.json({
    items: reminders.map((item) => ({
      id: toNumberId(item.id),
      due_at: item.dueAt.toISOString(),
      message: item.message,
      status: item.status
    }))
  });
}
