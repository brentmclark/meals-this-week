import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { toNumberId } from "../../../../lib/db-format";
import { prisma } from "../../../../lib/prisma";

// Cron target: fetch due reminders and mark as sent.
// Wire email provider here (Resend/Postmark) for real delivery.
export async function POST() {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const provided = headers().get("x-cron-secret");
    if (!provided || provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const due = await prisma.reminder.findMany({
    where: { status: "pending", dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
    take: 50,
    select: { id: true, message: true, dueAt: true }
  });
  if (due.length === 0) return NextResponse.json({ sent: 0, items: [] });

  await prisma.reminder.updateMany({
    where: { id: { in: due.map((item) => item.id) } },
    data: { status: "sent", sentAt: new Date() }
  });

  return NextResponse.json({
    sent: due.length,
    items: due.map((item) => ({
      id: toNumberId(item.id),
      message: item.message,
      due_at: item.dueAt.toISOString()
    }))
  });
}
