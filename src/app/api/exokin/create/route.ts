
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Helper to generate initial neurochemistry
function generateNeurochemistry(type: string, gender: string) {
    // Baseline levels based on type
    const isWarrior = type === "warform";

    return {
        dopamine: 0.5,
        serotonin: 0.5,
        norepinephrine: isWarrior ? 0.8 : 0.4,
        oxytocin: isWarrior ? 0.3 : 0.7,
        learningRate: 0.1,
        mood: "neutral",
        dominance: isWarrior ? 0.7 : 0.3,
        curiosity: 0.5,
        energy: 1.0,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, gender, type } = body;

        if (!name || !gender || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate deterministic seed
        const morphologySeed = uuidv4();

        // Generate neurochemistry
        const neurochemistryBase = generateNeurochemistry(type, gender);

        // Create Exokin
        const exokin = await prisma.exokin.create({
            data: {
                name,
                gender,
                type,
                morphologySeed,
                neurochemistryBase: JSON.stringify(neurochemistryBase),
            },
        });

        return NextResponse.json(exokin);
    } catch (error) {
        console.error("Failed to create exokin:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
