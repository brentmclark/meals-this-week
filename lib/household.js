import { toBigIntId, toNumberId } from "./db-format";
import { prisma } from "./prisma";

export async function ensureDefaultHousehold() {
  const householdName = process.env.DEFAULT_HOUSEHOLD_NAME || "Home";
  const userName = process.env.DEFAULT_USER_NAME || "Family";
  const userEmail = process.env.DEFAULT_USER_EMAIL || "family@example.com";

  const household = await prisma.household.upsert({
    where: { name: householdName },
    update: {},
    create: { name: householdName }
  });

  const householdId = household.id;

  await prisma.thawRule.createMany({
    data: [
      { householdId, name: "Chicken", leadDays: 1 },
      { householdId, name: "Chuck roast", leadDays: 2 },
      { householdId, name: "Turkey/Ham", leadDays: 5 }
    ],
    skipDuplicates: true
  });

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: { displayName: userName },
    create: {
      householdId: toBigIntId(householdId),
      email: userEmail,
      displayName: userName,
      role: "admin"
    }
  });

  return { householdId: toNumberId(householdId), userId: toNumberId(user.id) };
}
