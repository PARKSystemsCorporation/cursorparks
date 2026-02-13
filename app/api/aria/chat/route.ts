import { NextResponse } from "next/server";
import { processMessage } from "../../../../src/lib/aria/correlator";
import { generateResponse } from "../../../../src/lib/aria/generator";
import { getNpcBrainDb } from "../../../../src/lib/npc/brain";
import { insertShort } from "../../../../src/lib/npc/memory";
import { computeSocialOverlap } from "../../../../src/lib/npc/social";
import { getCorrelationClusters } from "../../../../src/lib/npc/correlation";
import { buildEnvironmentContext } from "../../../../src/lib/npc/environment";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, vendorId, timePhase, entityDensity, sceneId } = body;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const vid = vendorId || "barker";

        // 1. Process & Learn (ARIA word correlations)
        const processingResult = await processMessage(message);

        // 2. NPC brain: record player phrase as heard by this vendor
        let npcDb = null;
        let environmentContext = null;
        let socialOverlap = 0;
        try {
            npcDb = getNpcBrainDb();
            insertShort(npcDb, vid, { phraseHeard: message });
            environmentContext = buildEnvironmentContext({
                timePhase: typeof timePhase === "number" ? timePhase : 0.5,
                entityDensity: typeof entityDensity === "number" ? entityDensity : 0,
                sceneId: sceneId || "bazaar",
            });
            const clusters = getCorrelationClusters(npcDb, { npcId: vid, inputWords: message.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2), environmentContext });
            const topWords = clusters[0]?.words ?? [];
            socialOverlap = computeSocialOverlap(npcDb, vid, topWords);
        } catch (e) {
            console.warn("[ARIA] NPC brain unavailable:", (e as Error).message);
        }

        // 3. Generate Response (correlation-driven when npcDb available)
        const responseText = await generateResponse(message, vid, {
            npcDb: npcDb ?? undefined,
            environmentContext: environmentContext ?? undefined,
            socialOverlap,
        });

        const isLearned = processingResult.processed
            ? (processingResult.newPhrases || 0) > 0 || (processingResult.newCorrelations || 0) > 0
            : false;

        return NextResponse.json({
            response: responseText,
            debug: {
                learned: isLearned,
                stats: processingResult,
            },
        });
    } catch (error) {
        console.error("[ARIA] Chat error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}

