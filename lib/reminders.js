import { toBigIntId } from "./db-format";
import { prisma } from "./prisma";

export async function scheduleReminderForEntry(entryId) {
  const row = await prisma.mealEntry.findUnique({
    where: { id: toBigIntId(entryId) },
    include: { thawRule: true }
  });

  if (!row) return;

  const reminderLabel = row.thawReminderLabel || row.thawRule?.name || null;
  const leadDays = row.thawLeadDays ?? row.thawRule?.leadDays ?? null;

  await prisma.reminder.deleteMany({ where: { mealEntryId: toBigIntId(entryId) } });
  if (!reminderLabel || leadDays === null) return;

  const dueAt = new Date(row.dayDate);
  dueAt.setHours(9, 0, 0, 0);
  dueAt.setDate(dueAt.getDate() - leadDays);

  const mealLabel = row.mealName || "planned meal";
  const leadText = leadDays === 1 ? "1 day before" : `${leadDays} days before`;
  const message = `Thaw reminder: ${reminderLabel} for ${mealLabel} (${leadText}).`;

  await prisma.reminder.create({
    data: {
      householdId: row.householdId,
      mealEntryId: row.id,
      reminderType: "thaw",
      dueAt,
      message,
      status: "pending"
    }
  });
}
