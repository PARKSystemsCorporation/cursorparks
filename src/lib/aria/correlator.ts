import { prisma } from "../../server/db";

// Types
export interface Token {
    word: string;
    position: number;
}

export interface CorrelationResult {
    newCorrelations: number;
    reinforced: number;
    promoted: number;
}

export interface DecayResult {
    decayed: number;
    demoted: number;
    toGraveyard: number;
}

// Configuration
export const THRESHOLDS = {
    SHORT_MAX: 0.30,
    MEDIUM_MAX: 0.80,
    DECAY_MIN: 0.05
};

export const DECAY_CONFIG = {
    short: { interval: 50, rate: 0.15 },
    medium: { interval: 200, rate: 0.05 },
    long: { interval: 1000, rate: 0.01 },
    decay: { interval: 0, rate: 0 } // Type safety placeholder
};

const PHRASE_INTERVAL = 5;
const DECAY_INTERVAL = 10;

let phraseTick = 0;
let decayTick = 0;

// Tokenization
export function tokenizeMessage(text: string): Token[] {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s'-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(w => w.length >= 2);

    return words.map((word, index) => ({
        word,
        position: index
    }));
}

// Scoring
function scoreProximity(distance: number): number {
    if (distance === 1) return 1.0;
    if (distance === 2) return 0.8;
    if (distance <= 4) return 0.5;
    if (distance <= 7) return 0.3;
    return 0.1;
}

function calculateInitialScore(distance: number): number {
    return scoreProximity(distance) * 0.1;
}

// Helpers
export function generatePatternKey(word1: string, word2: string): string {
    const sorted = [word1.toLowerCase(), word2.toLowerCase()].sort();
    return sorted.join('_');
}

export function getTierForScore(score: number): 'short' | 'medium' | 'long' {
    if (score >= THRESHOLDS.MEDIUM_MAX) return 'long';
    if (score >= THRESHOLDS.SHORT_MAX) return 'medium';
    return 'short';
}

async function getAndIncrementMessageIndex(): Promise<number> {
    try {
        const counter = await prisma.ariaMessageCounter.upsert({
            where: { id: 1 },
            update: { currentIndex: { increment: 1 } },
            create: { id: 1, currentIndex: 1 }
        });
        return counter.currentIndex;
    } catch (e) {
        console.error("Error incrementing message index:", e);
        return 0;
    }
}

// Core Logic
async function findExistingCorrelation(patternKey: string) {
    // Check Long
    const long = await prisma.ariaLong.findFirst({ where: { patternKey } });
    if (long) return { ...long, currentTier: 'long' as const };

    // Check Medium
    const medium = await prisma.ariaMedium.findFirst({ where: { patternKey } });
    if (medium) return { ...medium, currentTier: 'medium' as const };

    // Check Short
    const short = await prisma.ariaShort.findFirst({ where: { patternKey } });
    if (short) return { ...short, currentTier: 'short' as const };

    // Check Decay
    const decay = await prisma.ariaDecay.findFirst({ where: { patternKey } });
    if (decay) return { ...decay, currentTier: 'decay' as const };

    return null;
}

async function moveCorrelation(correlation: any, fromTier: string, toTier: string) {
    if (fromTier === toTier) return false;

    // Delete from old table
    if (fromTier === 'long') await prisma.ariaLong.delete({ where: { id: correlation.id } });
    else if (fromTier === 'medium') await prisma.ariaMedium.delete({ where: { id: correlation.id } });
    else if (fromTier === 'short') await prisma.ariaShort.delete({ where: { id: correlation.id } });
    else if (fromTier === 'decay') await prisma.ariaDecay.delete({ where: { id: correlation.id } });

    // Insert into new table
    const data = {
        id: correlation.id, // Keep ID
        patternKey: correlation.patternKey,
        word1: correlation.word1,
        word2: correlation.word2,
        correlationScore: correlation.correlationScore,
        reinforcementCount: correlation.reinforcementCount,
        decayCount: correlation.decayCount || 0,
        decayAtMessage: correlation.decayAtMessage,
        lastSeenMessageIndex: correlation.lastSeenMessageIndex,
    };

    if (toTier === 'long') await prisma.ariaLong.create({ data });
    else if (toTier === 'medium') await prisma.ariaMedium.create({ data });
    else if (toTier === 'short') await prisma.ariaShort.create({ data });
    // Note: We don't move TO decay here typically, handled in checkDecay logic, but if needed:
    else if (toTier === 'decay') await prisma.ariaDecay.create({
        data: {
            ...data,
            decayedFrom: fromTier,
            decayedAt: new Date()
        }
    });

    return true;
}

// Correlator
async function runCorrelator(words: Token[], messageIndex: number): Promise<CorrelationResult> {
    if (words.length < 2) return { newCorrelations: 0, reinforced: 0, promoted: 0 };

    let newCorrelations = 0;
    let reinforced = 0;
    let promoted = 0;

    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < Math.min(i + 5, words.length); j++) {
            const wordA = words[i];
            const wordB = words[j];
            const distance = j - i;

            if (wordA.word === wordB.word) continue;

            const patternKey = generatePatternKey(wordA.word, wordB.word);
            const existing = await findExistingCorrelation(patternKey);

            if (existing) {
                // REINFORCE
                const addScore = calculateInitialScore(distance);
                const newScore = Math.min(1.0, existing.correlationScore + addScore);
                const newTier = getTierForScore(newScore);
                const currentTier = existing.currentTier;

                const updateData = {
                    correlationScore: newScore,
                    reinforcementCount: existing.reinforcementCount + 1,
                    lastSeenMessageIndex: messageIndex,
                    decayAtMessage: messageIndex + (DECAY_CONFIG[newTier as keyof typeof DECAY_CONFIG]?.interval || 50),
                };

                // Update current table
                if (currentTier === 'long') await prisma.ariaLong.update({ where: { id: existing.id }, data: updateData });
                else if (currentTier === 'medium') await prisma.ariaMedium.update({ where: { id: existing.id }, data: updateData });
                else if (currentTier === 'short') await prisma.ariaShort.update({ where: { id: existing.id }, data: updateData });
                else if (currentTier === 'decay') await prisma.ariaDecay.update({
                    where: { id: existing.id },
                    data: { ...updateData, correlationScore: newScore } // Decay table has slightly diff schema but mostly compatible for update? No, decay table has decayFrom.
                });

                reinforced++;

                // Check promotion
                if (currentTier !== 'decay' && newTier !== currentTier) {
                    existing.correlationScore = newScore;
                    existing.reinforcementCount++;
                    existing.lastSeenMessageIndex = messageIndex;
                    existing.decayAtMessage = updateData.decayAtMessage;

                    const moved = await moveCorrelation(existing, currentTier, newTier);
                    if (moved) promoted++;
                } else if (currentTier === 'decay') {
                    // Resurrect
                    existing.correlationScore = newScore;
                    existing.reinforcementCount++;
                    existing.lastSeenMessageIndex = messageIndex;
                    existing.decayAtMessage = updateData.decayAtMessage;

                    const moved = await moveCorrelation(existing, 'decay', newTier);
                    if (moved) promoted++;
                }

            } else {
                // NEW
                const initialScore = calculateInitialScore(distance);
                const tier = getTierForScore(initialScore);
                const sorted = [wordA.word, wordB.word].sort();

                const newData = {
                    patternKey,
                    word1: sorted[0],
                    word2: sorted[1],
                    correlationScore: initialScore,
                    reinforcementCount: 1,
                    decayCount: 0,
                    decayAtMessage: messageIndex + DECAY_CONFIG[tier].interval,
                    lastSeenMessageIndex: messageIndex
                };

                if (tier === 'long') await prisma.ariaLong.create({ data: newData });
                else if (tier === 'medium') await prisma.ariaMedium.create({ data: newData });
                else await prisma.ariaShort.create({ data: newData }); // Default to short

                newCorrelations++;
            }
        }
    }

    return { newCorrelations, reinforced, promoted };
}

// Phrases
async function buildPhrases(messageIndex: number) {
    // Fetch strong correlations
    const strongCorrs = await prisma.ariaMedium.findMany({ orderBy: { correlationScore: 'desc' }, take: 50 });
    const longCorrs = await prisma.ariaLong.findMany({ orderBy: { correlationScore: 'desc' }, take: 50 });

    const correlations = [...strongCorrs, ...longCorrs];
    if (correlations.length < 2) return 0;

    let newPhrases = 0;
    const processedPairs = new Set();

    // Simplistic phrase building for now (O(N^2))
    for (let i = 0; i < correlations.length; i++) {
        for (let j = i + 1; j < correlations.length; j++) {
            const corrA = correlations[i];
            const corrB = correlations[j];

            const wordsA = [corrA.word1, corrA.word2];
            const wordsB = [corrB.word1, corrB.word2];

            const sharedWord = wordsA.find(w => wordsB.includes(w));
            if (!sharedWord) continue;

            const allWords = [...new Set([...wordsA, ...wordsB])].sort();
            if (allWords.length < 3) continue;

            const phraseKey = allWords.join('_');
            if (processedPairs.has(phraseKey)) continue;
            processedPairs.add(phraseKey);

            const existing = await prisma.ariaPhrase.findUnique({ where: { phraseKey } });

            if (existing) {
                const combinedScore = Math.min(1.0, corrA.correlationScore + corrB.correlationScore);
                const newScore = Math.min(1.0, existing.correlationScore + combinedScore * 0.5);
                const newTier = getTierForScore(newScore);

                await prisma.ariaPhrase.update({
                    where: { id: existing.id },
                    data: {
                        correlationScore: newScore,
                        reinforcementCount: { increment: 1 },
                        tier: newTier,
                        decayAtMessage: messageIndex + DECAY_CONFIG[newTier as keyof typeof DECAY_CONFIG].interval,
                        lastSeenMessageIndex: messageIndex
                    }
                });
            } else {
                const combinedScore = Math.min(1.0, (corrA.correlationScore + corrB.correlationScore) * 0.5);
                const tier = getTierForScore(combinedScore);

                await prisma.ariaPhrase.create({
                    data: {
                        phraseKey,
                        words: JSON.stringify(allWords),
                        sourceCorrelations: JSON.stringify([corrA.id, corrB.id]),
                        correlationScore: combinedScore,
                        reinforcementCount: 1,
                        decayCount: 0,
                        decayAtMessage: messageIndex + DECAY_CONFIG[tier as keyof typeof DECAY_CONFIG].interval,
                        tier,
                        lastSeenMessageIndex: messageIndex
                    }
                });
                newPhrases++;
            }
        }
    }
    return newPhrases;
}

// Decay
async function checkDecay(currentMessageIndex: number): Promise<DecayResult> {
    let totalDecayed = 0;
    let totalDemoted = 0;
    let totalToGraveyard = 0;

    const tiers = ['short', 'medium', 'long'] as const;

    for (const tier of tiers) {
        let items = [];
        if (tier === 'short') items = await prisma.ariaShort.findMany({ where: { decayAtMessage: { lte: currentMessageIndex } } });
        else if (tier === 'medium') items = await prisma.ariaMedium.findMany({ where: { decayAtMessage: { lte: currentMessageIndex } } });
        else items = await prisma.ariaLong.findMany({ where: { decayAtMessage: { lte: currentMessageIndex } } });

        if (items.length === 0) continue;

        for (const item of items) {
            const config = DECAY_CONFIG[tier];
            const newScore = item.correlationScore * (1 - config.rate);
            const newDecayCount = (item.decayCount || 0) + 1;

            if (newScore < THRESHOLDS.DECAY_MIN) {
                // To Graveyard (Delete and insert into Decay)
                if (tier === 'short') await prisma.ariaShort.delete({ where: { id: item.id } });
                else if (tier === 'medium') await prisma.ariaMedium.delete({ where: { id: item.id } });
                else await prisma.ariaLong.delete({ where: { id: item.id } });

                await prisma.ariaDecay.create({
                    data: {
                        id: item.id, // Keep ID for tracking? Or let it generate new?
                        patternKey: item.patternKey,
                        word1: item.word1,
                        word2: item.word2,
                        correlationScore: newScore,
                        reinforcementCount: item.reinforcementCount,
                        decayCount: newDecayCount,
                        decayedFrom: tier
                    }
                });
                totalToGraveyard++;
            } else {
                const newTier = getTierForScore(newScore);

                if (newTier !== tier) {
                    // Demote
                    item.correlationScore = newScore;
                    item.decayCount = newDecayCount;
                    item.decayAtMessage = currentMessageIndex + DECAY_CONFIG[newTier].interval;
                    await moveCorrelation(item, tier, newTier);
                    totalDemoted++;
                } else {
                    // Just decay score
                    const updateData = {
                        correlationScore: newScore,
                        decayCount: newDecayCount,
                        decayAtMessage: currentMessageIndex + config.interval
                    };
                    if (tier === 'short') await prisma.ariaShort.update({ where: { id: item.id }, data: updateData });
                    else if (tier === 'medium') await prisma.ariaMedium.update({ where: { id: item.id }, data: updateData });
                    else await prisma.ariaLong.update({ where: { id: item.id }, data: updateData });
                    totalDecayed++;
                }
            }
        }
    }

    return { decayed: totalDecayed, demoted: totalDemoted, toGraveyard: totalToGraveyard };
}

// Main Process Entry
export async function processMessage(messageText: string) {
    if (!messageText) return { processed: false };

    const messageIndex = await getAndIncrementMessageIndex();
    const words = tokenizeMessage(messageText);

    const corrResult = await runCorrelator(words, messageIndex);

    phraseTick++;
    decayTick++;

    let newPhrases = 0;
    if (phraseTick % PHRASE_INTERVAL === 0) {
        newPhrases = await buildPhrases(messageIndex);
    }

    if (decayTick % DECAY_INTERVAL === 0) {
        await checkDecay(messageIndex);
    }

    return {
        processed: true,
        messageIndex,
        wordCount: words.length,
        ...corrResult,
        newPhrases
    };
}
