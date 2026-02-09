import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { createSession, verifyPassword } from "@/src/server/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const name = String(username || "").trim().toUpperCase();
  const pass = String(password || "");
  if (!name || !pass) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { username: name } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await verifyPassword(pass, user.passHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const session = await createSession(user.id);
  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set("ps_session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt
  });
  return res;
}
