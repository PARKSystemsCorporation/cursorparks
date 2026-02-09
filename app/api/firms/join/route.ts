import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Invite token required" }, { status: 400 });
  const existingMember = await prisma.firmMember.findUnique({ where: { userId: user.id } });
  if (existingMember) return NextResponse.json({ error: "Already in firm" }, { status: 400 });
  const invite = await prisma.firmInvite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.firmMember.create({ data: { firmId: invite.firmId, userId: user.id, role: "trader" } }),
    prisma.firmInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } })
  ]);
  return NextResponse.json({ ok: true });
}
