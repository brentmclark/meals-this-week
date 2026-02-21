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

export async function ensureHouseholdId() {
  const householdId = await ensureHousehold();
  return toNumberId(householdId);
}

export async function ensureHouseholdUser({ email, displayName, role = "member", username }) {
  const householdId = await ensureHousehold();

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername =
    typeof username === "string" && username.trim() ? username.trim().toLowerCase() : undefined;

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      householdId: toBigIntId(householdId),
      displayName,
      role,
      ...(normalizedUsername ? { username: normalizedUsername } : {})
    },
    create: {
      householdId: toBigIntId(householdId),
      ...(normalizedUsername ? { username: normalizedUsername } : {}),
      email: normalizedEmail,
      displayName,
      role
    }
  });

  return { householdId: toNumberId(householdId), userId: toNumberId(user.id) };
}

export async function ensureDefaultHousehold() {
  const userName = process.env.DEFAULT_USER_NAME || "Family";
  const userEmail = process.env.DEFAULT_USER_EMAIL || "family@example.com";
  return ensureHouseholdUser({ email: userEmail, displayName: userName, role: "manager" });
}

export async function createHouseholdLocalUser({
  householdId,
  username,
  email,
  displayName,
  role = "member",
  passwordHash,
  emailVerifiedAt = null
}) {
  const resolvedHouseholdId =
    householdId !== undefined && householdId !== null ? toBigIntId(householdId) : await ensureHousehold();

  const user = await prisma.user.create({
    data: {
      householdId: resolvedHouseholdId,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      displayName: displayName.trim(),
      role,
      emailVerifiedAt
    }
  });

  return { householdId: toNumberId(resolvedHouseholdId), userId: toNumberId(user.id) };
}
