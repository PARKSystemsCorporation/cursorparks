import { prisma } from "../../server/db";
import { tokenizeMessage, CorrelationData } from "./correlator";

// Generator Config
const GENERATION_CONFIG = {
    maxWords: 15, // Slightly verbose vendors
    minWords: 3,
    strengthThreshold: 0.1,
    randomnessFactor: 0.3
};

// Types
interface GraphNode {
    edges: GraphEdge[];
    category: string;
}

interface GraphEdge {
    word: string;
    weight: number;
    category: string;
    score?: number;
}

// Data Fetchers
async function getTopPairs(limit = 100) {
    // Combine from all tiers
    const long = await prisma.ariaLong.findMany({ orderBy: { correlationScore: 'desc' }, take: limit });
    const medium = await prisma.ariaMedium.findMany({ orderBy: { correlationScore: 'desc' }, take: limit });
    // Maybe fewer short term?
    const short = await prisma.ariaShort.findMany({ orderBy: { correlationScore: 'desc' }, take: Math.floor(limit / 2) });

    return [...long, ...medium, ...short]; // Not sorted perfectly but mixed
}

async function searchByWord(word: string) {
    const term = word.toLowerCase();

    // Naive search: OR condition on word1/word2
    // Prisma doesn't support generic OR across fields easily without detailed syntax, 
    // but here we know the specific fields.
    const where = { OR: [{ word1: term }, { word2: term }] };

    const long = await prisma.ariaLong.findMany({ where, orderBy: { correlationScore: 'desc' }, take: 20 });
    const medium = await prisma.ariaMedium.findMany({ where, orderBy: { correlationScore: 'desc' }, take: 20 });
    const short = await prisma.ariaShort.findMany({ where, orderBy: { correlationScore: 'desc' }, take: 20 });

    return [...long, ...medium, ...short];
}

// Graph Building
function buildWordGraph(pairs: CorrelationData[]) {
    const graph = new Map<string, GraphNode>();

    for (const pair of pairs) {
        if (pair.correlationScore < GENERATION_CONFIG.strengthThreshold) continue;

        const w1 = pair.word1;
        const w2 = pair.word2;

        // Simple category guessing (since we don't have the token stats populated yet)
        // In a real version, we'd fetch categories. For now, assume unclassified.
        const cat1 = 'unclassified';
        const cat2 = 'unclassified';

        if (!graph.has(w1)) graph.set(w1, { edges: [], category: cat1 });
        if (!graph.has(w2)) graph.set(w2, { edges: [], category: cat2 });

        graph.get(w1)?.edges.push({ word: w2, weight: pair.correlationScore, category: cat2 });
        graph.get(w2)?.edges.push({ word: w1, weight: pair.correlationScore, category: cat1 });
    }

    // Sort edges
    for (const node of graph.values()) {
        node.edges.sort((a, b) => b.weight - a.weight);
    }

    return graph;
}

function selectNextWord(edges: GraphEdge[]) {
    // Add randomness
    const scored = edges.map(e => ({
        ...e,
        score: e.weight * (1 + Math.random() * GENERATION_CONFIG.randomnessFactor)
    }));

    scored.sort((a, b) => b.score - a.score);

    // Pick top 1-3
    const index = Math.random() < 0.6 ? 0 : Math.random() < 0.8 ? 1 : 2;
    return scored[Math.min(index, scored.length - 1)];
}

async function walkGraph(graph: Map<string, GraphNode>, startWord: string, maxLength: number) {
    const path = [startWord];
    let current = startWord;
    const visited = new Set([startWord]);

    for (let i = 0; i < maxLength; i++) {
        const node = graph.get(current);
        if (!node || node.edges.length === 0) break;

        // Filter visited
        const available = node.edges.filter(e => !visited.has(e.word));
        if (available.length === 0) break;

        const next = selectNextWord(available);
        if (!next) break;

        path.push(next.word);
        visited.add(next.word);
        current = next.word;
    }
    return path;
}

// Main Generation Function
export async function generateResponse(input: string) {
    const keywords = tokenizeMessage(input).map(t => t.word);

    // Fetch related pairs
    const allPairs: CorrelationData[] = [];

    // 1. Keyword search (Contextual)
    for (const kw of keywords) {
        const pairs = await searchByWord(kw);
        allPairs.push(...pairs);
    }

    // 2. Top global pairs (Background thought)
    if (allPairs.length < 50) {
        const top = await getTopPairs(50);
        allPairs.push(...top);
    }

    // De-dupe
    const uniquePairs = Array.from(new Map(allPairs.map(p => [p.patternKey, p])).values());

    if (uniquePairs.length === 0) return "...";

    // Build Graph
    const graph = buildWordGraph(uniquePairs);

    // Find start word (Keyword present in graph, or highest connected)
    let startWord = keywords.find(k => graph.has(k)) || "";

    if (!startWord) {
        // Find highest degree node
        let maxDegree = 0;
        for (const [word, node] of graph.entries()) {
            if (node.edges.length > maxDegree) {
                maxDegree = node.edges.length;
                startWord = word;
            }
        }
    }

    if (!startWord) return "...";

    // Walk
    const path = await walkGraph(graph, startWord, GENERATION_CONFIG.maxWords);

    return path.join(" ");
}
