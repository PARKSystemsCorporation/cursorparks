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

        // 1. Process & Learn (Async, but we await to ensure DB consistency for generation)
        const processingResult = await processMessage(message, vendorId || "unknown");

        // 2. Generate Response
        const responseText = await generateResponse(message);

        return NextResponse.json({
            response: responseText,
            debug: {
                learned: processingResult.newPhrases > 0 || processingResult.newCorrelations > 0,
                stats: processingResult
            }
        });

    } catch (error) {
        console.error("[ARIA] Chat error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}
