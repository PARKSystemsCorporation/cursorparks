import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { createSession, verifyPassword } from "@/src/server/auth";

export async function POST(req: Request) {
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
  await createSession(user.id);
  return NextResponse.json({ ok: true, username: user.username });
}
