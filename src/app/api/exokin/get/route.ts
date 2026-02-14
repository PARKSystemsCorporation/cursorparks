
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: Request) {
    try {
        // In a real app, we'd get userId from session.
        // For now, we fetch the most recent created exokin as a fallback, 
        // or return null if none found. 
        // Ideally we'd pass a userId or sessionId in headers/cookies.

        // For this prototype, we'll just check if *any* exokin exists, 
        // assuming single-user local dev environment.
        const exokin = await prisma.exokin.findFirst({
            orderBy: { createdAt: "desc" },
        });

        if (!exokin) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({ found: true, exokin });
    } catch (error) {
        console.error("Failed to fetch exokin:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
