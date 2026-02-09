import { NextResponse } from "next/server";
import crypto from "crypto";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { invitedName } = await req.json();
  const name = String(invitedName || "").trim().toUpperCase();
  if (!name) return NextResponse.json({ error: "Invite username required" }, { status: 400 });

  const member = await prisma.firmMember.findUnique({ where: { userId: user.id }, include: { firm: true } });
  if (!member) return NextResponse.json({ error: "Not in a firm" }, { status: 400 });

  const token = crypto.randomBytes(12).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.firmInvite.create({
    data: {
      firmId: member.firmId,
      invitedName: name,
      invitedById: user.id,
      token,
      expiresAt
    }
  });
  return NextResponse.json({ ok: true, token });
}
