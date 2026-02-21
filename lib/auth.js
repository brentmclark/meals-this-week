import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "family_session";

function hmac(payload) {
  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionCookie(userId, householdId) {
  const payload = `${userId}:${householdId}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifySessionCookie(value) {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const [userId, householdId] = payload.split(":");
  if (!userId || !householdId) return null;
  return { userId: Number(userId), householdId: Number(householdId) };
}

export function passcodeHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function tokenHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `s2$${salt}$${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string" || !storedHash.startsWith("s2$")) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !/^[a-f0-9]+$/.test(expectedHex)) return false;

  const actualHex = crypto.scryptSync(password, salt, 64).toString("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function setAuthCookie(userId, householdId) {
  const value = createSessionCookie(userId, householdId);
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export function getSessionFromCookies() {
  const value = cookies().get(COOKIE_NAME)?.value;
  return verifySessionCookie(value);
}
