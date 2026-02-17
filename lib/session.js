import { NextResponse } from "next/server";
import { getSessionFromCookies } from "./auth";

export function requireSession() {
  const session = getSessionFromCookies();
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { session };
}
