import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const exokinId = searchParams.get("exokinId");

    if (!exokinId) {
        return NextResponse.json({ error: "exokinId required" }, { status: 400 });
    }

    try {
        const memories = await prisma.exokinLanguageMemory.findMany({
            where: { exokinId },
        });
        return NextResponse.json(memories);
    } catch (error) {
        console.error("Failed to fetch memories:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { exokinId, meaning, root, word, emotionalWeight, category } = body;

        if (!exokinId || !meaning || !root || !word) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const memory = await prisma.exokinLanguageMemory.upsert({
            where: {
                exokinId_meaning_root: {
                    exokinId,
                    meaning,
                    root,
                },
            },
            update: {
                timesUsed: { increment: 1 },
                lastUsed: new Date(),
                emotionalWeight: emotionalWeight || 0,
            },
            create: {
                exokinId,
                meaning,
                root,
                word,
                category: category || "unknown",
                emotionalWeight: emotionalWeight || 0,
                timesUsed: 1,
            },
        });

        return NextResponse.json(memory);
    } catch (error) {
        console.error("Failed to save memory:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
