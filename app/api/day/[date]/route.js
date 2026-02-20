import { NextResponse } from "next/server";
import { z } from "zod";
import { parseISODate, toISODate } from "../../../../lib/date";
import { toBigIntId, toNumberId } from "../../../../lib/db-format";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/session";
import { scheduleReminderForEntry } from "../../../../lib/reminders";

const schema = z.object({
  nightType: z.enum(["quick", "normal", "out"]).optional(),
  mealName: z.string().max(140).optional(),
  notes: z.string().max(400).optional(),
  thawReminderLabel: z.union([z.string().trim().min(1).max(140), z.null()]).optional(),
  thawLeadDays: z.union([z.number().int().min(0).max(14), z.null()]).optional()
});

async function ensureDay(householdId, dayDate) {
  const row = await prisma.weekDay.upsert({
    where: {
      householdId_dayDate: {
        householdId: toBigIntId(householdId),
        dayDate: parseISODate(dayDate)
      }
    },
    update: {},
    create: {
      householdId: toBigIntId(householdId),
      dayDate: parseISODate(dayDate)
    }
  });
  return row.id;
}

export async function GET(_, { params }) {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const dayDate = toISODate(parseISODate(params.date));
  const data = await prisma.weekDay.findFirst({
    where: {
      householdId: toBigIntId(auth.session.householdId),
      dayDate: parseISODate(dayDate)
    },
    include: { mealEntry: { include: { thawRule: true } } }
  });
  if (!data) return NextResponse.json(null);

  return NextResponse.json({
    day_date: dayDate,
    night_type: data.nightType,
    meal_entry_id: data.mealEntry ? toNumberId(data.mealEntry.id) : null,
    meal_name: data.mealEntry?.mealName || "",
    notes: data.mealEntry?.notes || "",
    thaw_reminder_label: data.mealEntry?.thawReminderLabel || data.mealEntry?.thawRule?.name || null,
    thaw_lead_days: data.mealEntry?.thawLeadDays ?? data.mealEntry?.thawRule?.leadDays ?? null
  });
}

export async function PUT(request, { params }) {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const dayDate = toISODate(parseISODate(params.date));
  const dayId = await ensureDay(auth.session.householdId, dayDate);
  const { nightType, mealName, notes, thawReminderLabel, thawLeadDays } = parsed.data;

  if (nightType) {
    await prisma.weekDay.update({
      where: { id: dayId },
      data: { nightType }
    });
  }

  let mealEntryId = null;

  if (
    mealName !== undefined ||
    notes !== undefined ||
    thawReminderLabel !== undefined ||
    thawLeadDays !== undefined
  ) {
    const upsert = await prisma.mealEntry.upsert({
      where: { weekDayId: dayId },
      update: {
        mealName,
        notes,
        thawReminderLabel,
        thawLeadDays,
        thawRuleId: thawReminderLabel !== undefined || thawLeadDays !== undefined ? null : undefined,
        updatedAt: new Date()
      },
      create: {
        householdId: toBigIntId(auth.session.householdId),
        weekDayId: dayId,
        dayDate: parseISODate(dayDate),
        mealName: mealName || "",
        notes: notes || "",
        thawReminderLabel: thawReminderLabel ?? null,
        thawLeadDays: thawLeadDays ?? null,
        thawRuleId: null,
        createdBy: toBigIntId(auth.session.userId)
      }
    });

    mealEntryId = toNumberId(upsert.id);

    if (upsert.mealName) {
      await prisma.mealHistory.upsert({
        where: {
          householdId_mealEntryId: {
            householdId: toBigIntId(auth.session.householdId),
            mealEntryId: upsert.id
          }
        },
        update: {},
        create: {
          householdId: toBigIntId(auth.session.householdId),
          mealEntryId: upsert.id,
          mealName: upsert.mealName,
          occurredOn: parseISODate(dayDate)
        }
      });
    }

    if (mealName !== undefined || thawReminderLabel !== undefined || thawLeadDays !== undefined) {
      await scheduleReminderForEntry(mealEntryId);
    }
  }

  const result = await prisma.weekDay.findUnique({
    where: { id: dayId },
    include: { mealEntry: { include: { thawRule: true } } }
  });

  return NextResponse.json({
    day_date: dayDate,
    night_type: result.nightType,
    meal_entry_id: result.mealEntry ? toNumberId(result.mealEntry.id) : null,
    meal_name: result.mealEntry?.mealName || "",
    notes: result.mealEntry?.notes || "",
    thaw_reminder_label: result.mealEntry?.thawReminderLabel || result.mealEntry?.thawRule?.name || null,
    thaw_lead_days: result.mealEntry?.thawLeadDays ?? result.mealEntry?.thawRule?.leadDays ?? null
  });
}
