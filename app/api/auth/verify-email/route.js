import { NextResponse } from "next/server";
import { verifyEmailByToken } from "../../../../lib/auth-tokens";

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "token_required" }, { status: 400 });

  const verified = await verifyEmailByToken(token);
  if (!verified.ok) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
