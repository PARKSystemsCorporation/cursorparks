import { NextResponse } from 'next/server';
import { processMessage } from '../../../../src/lib/aria/correlator';
import { generateResponse } from '../../../../src/lib/aria/generator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, vendorId } = body;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // 1. Process & Learn
        const processingResult = await processMessage(message);

        // 2. Generate Response (vendor-aware)
        const responseText = await generateResponse(message, vendorId || "barker");

        const isLearned = processingResult.processed
            ? (processingResult.newPhrases || 0) > 0 || (processingResult.newCorrelations || 0) > 0
            : false;

        return NextResponse.json({
            response: responseText,
            debug: {
                learned: isLearned,
                stats: processingResult
            }
        });

    } catch (error) {
        console.error("[ARIA] Chat error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}

