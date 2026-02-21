import { prisma } from "./prisma";
import { generateOpaqueToken, tokenHash } from "./auth";
import { toBigIntId, toNumberId } from "./db-format";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

export function buildInviteUrl(token) {
  const url = new URL("/login", APP_BASE_URL);
  url.searchParams.set("invite", token);
  return url.toString();
}

export async function createInvite({ householdId, email, role, invitedById }) {
  const token = generateOpaqueToken();
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.householdInvite.create({
    data: {
      householdId: toBigIntId(householdId),
      email: email.trim().toLowerCase(),
      role,
      tokenHash: hash,
      invitedById: invitedById ? toBigIntId(invitedById) : null,
      expiresAt
    }
  });

  return {
    inviteId: toNumberId(invite.id),
    inviteUrl: buildInviteUrl(token),
    expiresAt
  };
}

export async function listInvites(householdId) {
  const rows = await prisma.householdInvite.findMany({
    where: { householdId: toBigIntId(householdId) },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { id: true, displayName: true, email: true } },
      acceptedBy: { select: { id: true, displayName: true, email: true } }
    }
  });

  return rows.map((row) => ({
    id: toNumberId(row.id),
    email: row.email,
    role: row.role,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    invitedBy: row.invitedBy
      ? {
          id: toNumberId(row.invitedBy.id),
          displayName: row.invitedBy.displayName,
          email: row.invitedBy.email
        }
      : null,
    acceptedBy: row.acceptedBy
      ? {
          id: toNumberId(row.acceptedBy.id),
          displayName: row.acceptedBy.displayName,
          email: row.acceptedBy.email
        }
      : null
  }));
}

export async function acceptInviteForExistingUser({ token, userId, userEmail }) {
  const hash = tokenHash(token);
  const invite = await prisma.householdInvite.findUnique({
    where: { tokenHash: hash }
  });
  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) return { ok: false };
  if (invite.email !== userEmail.trim().toLowerCase()) return { ok: false, error: "email_mismatch" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: toBigIntId(userId) },
      data: {
        householdId: invite.householdId,
        role: invite.role
      }
    }),
    prisma.householdInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        acceptedById: toBigIntId(userId)
      }
    })
  ]);

  return { ok: true, householdId: toNumberId(invite.householdId), role: invite.role };
}

export async function consumeInviteForSignup({ token, email, newUserId }) {
  const hash = tokenHash(token);
  const invite = await prisma.householdInvite.findUnique({
    where: { tokenHash: hash }
  });
  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) return { ok: false };
  if (invite.email !== email.trim().toLowerCase()) return { ok: false, error: "email_mismatch" };

  await prisma.householdInvite.update({
    where: { id: invite.id },
    data: {
      acceptedAt: new Date(),
      acceptedById: toBigIntId(newUserId)
    }
  });

  return { ok: true, householdId: toNumberId(invite.householdId), role: invite.role };
}

export async function validateInviteForEmail({ token, email }) {
  const hash = tokenHash(token);
  const invite = await prisma.householdInvite.findUnique({
    where: { tokenHash: hash }
  });
  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) return { ok: false };
  if (invite.email !== email.trim().toLowerCase()) return { ok: false, error: "email_mismatch" };
  return { ok: true, householdId: toNumberId(invite.householdId), role: invite.role };
}
