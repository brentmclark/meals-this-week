import { prisma } from "./prisma";
import { generateOpaqueToken, tokenHash } from "./auth";
import { toBigIntId } from "./db-format";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

function buildUrl(path, token) {
  const url = new URL(path, APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendAuthMail({ to, subject, body }) {
  // Placeholder email sender; replace with provider integration in production.
  console.info(`AUTH MAIL -> ${to} | ${subject}\n${body}`);
}

export async function createEmailVerificationForUser(userId, email) {
  const token = generateOpaqueToken();
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId: toBigIntId(userId),
      tokenHash: hash,
      expiresAt
    }
  });

  const verificationUrl = buildUrl("/verify-email", token);
  await sendAuthMail({
    to: email,
    subject: "Verify your Meals This Week account",
    body: `Open this link to verify your account: ${verificationUrl}`
  });

  return { verificationUrl, expiresAt };
}

export async function verifyEmailByToken(rawToken) {
  const hash = tokenHash(rawToken);
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true }
  });

  if (!token || token.usedAt || token.expiresAt <= new Date()) return { ok: false };

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: new Date() }
    })
  ]);

  return { ok: true, userId: token.userId };
}

export async function createPasswordResetForUser(userId, email) {
  const token = generateOpaqueToken();
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: toBigIntId(userId),
      tokenHash: hash,
      expiresAt
    }
  });

  const resetUrl = buildUrl("/reset-password", token);
  await sendAuthMail({
    to: email,
    subject: "Reset your Meals This Week passcode",
    body: `Open this link to reset your passcode: ${resetUrl}`
  });

  return { resetUrl, expiresAt };
}

export async function consumePasswordResetToken(rawToken, nextPasswordHash) {
  const hash = tokenHash(rawToken);
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hash }
  });
  if (!token || token.usedAt || token.expiresAt <= new Date()) return { ok: false };

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: token.userId },
      data: {
        passwordHash: nextPasswordHash,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    })
  ]);

  return { ok: true, userId: token.userId };
}
