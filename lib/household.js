import { toBigIntId, toNumberId } from "./db-format";
import { prisma } from "./prisma";

async function ensureHousehold() {
  const householdName = process.env.DEFAULT_HOUSEHOLD_NAME || "Home";

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

  return householdId;
}

export async function ensureHouseholdUser({ email, displayName, role = "member" }) {
  const householdId = await ensureHousehold();

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      householdId: toBigIntId(householdId),
      displayName,
      role
    },
    create: {
      householdId: toBigIntId(householdId),
      email,
      displayName,
      role
    }
  });

  return { householdId: toNumberId(householdId), userId: toNumberId(user.id) };
}

export async function ensureDefaultHousehold() {
  const userName = process.env.DEFAULT_USER_NAME || "Family";
  const userEmail = process.env.DEFAULT_USER_EMAIL || "family@example.com";
  return ensureHouseholdUser({ email: userEmail, displayName: userName, role: "admin" });
}
