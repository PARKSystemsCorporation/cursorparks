import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/src/server/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("ps_session")?.value;
  await clearSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ps_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
