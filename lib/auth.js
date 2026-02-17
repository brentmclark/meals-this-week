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
