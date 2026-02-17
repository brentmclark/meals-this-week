import { NextResponse } from "next/server";
import { z } from "zod";
import { parseISODate } from "../../../../lib/date";
import { toBigIntId, toISODateOnly, toNumberId } from "../../../../lib/db-format";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/session";

const patchSchema = z.object({
  status: z.enum(["staged", "planned", "archived"]).optional(),
  preferredDate: z.string().date().nullable().optional(),
  notBeforeDate: z.string().date().nullable().optional(),
  note: z.string().max(300).nullable().optional()
});

export async function PATCH(request, { params }) {
  const auth = requireSession();
  if (auth.error) return auth.error;

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.stagedMeal.findFirst({
    where: { id: toBigIntId(id), householdId: toBigIntId(auth.session.householdId) }
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = {};
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.preferredDate !== undefined) {
    data.preferredDate = parsed.data.preferredDate ? parseISODate(parsed.data.preferredDate) : null;
  }
  if (parsed.data.notBeforeDate !== undefined) {
    data.notBeforeDate = parsed.data.notBeforeDate ? parseISODate(parsed.data.notBeforeDate) : null;
  }
  if (parsed.data.note !== undefined) data.note = parsed.data.note;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "empty patch" }, { status: 400 });
  data.updatedAt = new Date();

  const updated = await prisma.stagedMeal.update({
    where: { id: toBigIntId(id) },
    data
  });

  return NextResponse.json({
    id: toNumberId(updated.id),
    meal_name: updated.mealName,
    preferred_date: toISODateOnly(updated.preferredDate),
    not_before_date: toISODateOnly(updated.notBeforeDate),
    note: updated.note,
    status: updated.status
  });
}
