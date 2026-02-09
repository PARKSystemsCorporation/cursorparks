import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/src/server/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ps_session")?.value;
    await clearSession(token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("ps_session", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
