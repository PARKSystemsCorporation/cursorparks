import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";

export async function POST() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.firmMember.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
