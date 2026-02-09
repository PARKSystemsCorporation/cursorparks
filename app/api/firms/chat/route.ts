import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";
import { getIO } from "@/src/server/socket";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.firmMember.findUnique({ where: { userId: user.id } });
    if (!member) return NextResponse.json({ error: "Not in firm" }, { status: 400 });
    const messages = await prisma.firmChat.findMany({
      where: { firmId: member.firmId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: true }
    });
    return NextResponse.json(
      messages.map((m: any) => ({
        id: m.id,
        user: m.user.username,
        message: m.message,
        t: m.createdAt
      }))
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.firmMember.findUnique({ where: { userId: user.id } });
    if (!member) return NextResponse.json({ error: "Not in firm" }, { status: 400 });
    const { message } = await req.json();
    const text = String(message || "").trim();
    if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
    const msg = await prisma.firmChat.create({
      data: { firmId: member.firmId, userId: user.id, message: text }
    });
    const io = getIO();
    if (io) {
      io.emit("firm:chat", {
        firmId: member.firmId,
        id: msg.id,
        user: user.username,
        message: msg.message,
        t: msg.createdAt
      });
    }
    return NextResponse.json({ ok: true, id: msg.id });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
