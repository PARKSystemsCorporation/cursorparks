import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { createSession, hashPassword } from "@/src/server/auth";

function getSessionCookieOptions(req: NextRequest, expiresAt: Date) {
  const origin = req.headers.get("origin");
  const requestOrigin = req.nextUrl.origin;
  const crossSite = !!origin && origin !== requestOrigin;
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite || process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  } as const;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }
    const name = String(username).trim().toUpperCase();
    if (name.length < 3 || name.length > 12) {
      return NextResponse.json({ error: "Username must be 3-12 chars" }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { username: name } });
    if (existing) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    const passHash = await hashPassword(String(password));
    const user = await prisma.user.create({
      data: {
        username: name,
        passHash,
        stats: { create: {} }
      }
    });
    const session = await createSession(user.id);
    const res = NextResponse.json({ ok: true, username: user.username });
    res.cookies.set("ps_session", session.token, getSessionCookieOptions(req, session.expiresAt));
    return res;
  } catch (error) {
    console.error("register failed", error);
    return NextResponse.json({ error: "Registration failed. Check database setup." }, { status: 500 });
  }
}
