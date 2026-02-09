import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const firmName = String(name || "").trim();
  if (firmName.length < 3 || firmName.length > 20) {
    return NextResponse.json({ error: "Firm name 3-20 chars" }, { status: 400 });
  }
  const existingMember = await prisma.firmMember.findUnique({ where: { userId: user.id } });
  if (existingMember) return NextResponse.json({ error: "Already in firm" }, { status: 400 });
  const firm = await prisma.firm.create({
    data: {
      name: firmName,
      founderId: user.id,
      members: {
        create: { userId: user.id, role: "founder" }
      }
    }
  });
  return NextResponse.json({ ok: true, firm });
}
