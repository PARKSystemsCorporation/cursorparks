import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const member = await prisma.firmMember.findUnique({
    where: { userId: user.id },
    include: { firm: true }
  });
  return NextResponse.json({ member });
}
