import { prisma } from "../../server/db";
import { tokenizeMessage, type CorrelationData } from "./correlator";

// ─────────────────────────────────────────────
// 1.  INTENT  DETECTOR
// ─────────────────────────────────────────────

type Intent =
    | "greeting"
    | "farewell"
    | "question"
    | "trade"
    | "help"
    | "compliment"
    | "insult"
    | "opinion"
    | "unknown";

const INTENT_KEYWORDS: Record<Intent, string[]> = {
    greeting: ["hello", "hi", "hey", "yo", "sup", "greetings", "howdy", "hola", "what's up", "whats up"],
    farewell: ["bye", "goodbye", "later", "see ya", "cya", "peace", "out", "leaving", "gotta go"],
    question: ["what", "where", "how", "why", "when", "who", "which", "is there", "do you", "can you", "tell me", "explain"],
    trade: ["buy", "sell", "trade", "price", "cost", "deal", "offer", "worth", "stock", "inventory", "got any", "how much"],
    help: ["help", "assist", "guide", "stuck", "lost", "confused", "tutorial", "how do i", "need", "advice"],
    compliment: ["nice", "cool", "awesome", "great", "amazing", "love", "beautiful", "impressive", "good job", "well done", "thanks", "thank you"],
    insult: ["suck", "bad", "terrible", "stupid", "hate", "worst", "trash", "garbage", "useless", "ugly", "lame", "boring"],
    opinion: ["think", "feel", "believe", "opinion", "best", "worst", "favorite", "prefer", "recommend", "suggest"],
    unknown: [],
};

function detectIntent(text: string): Intent {
    const lower = text.toLowerCase();

    // Score each intent
    let bestIntent: Intent = "unknown";
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Intent, string[]][]) {
        if (intent === "unknown") continue;
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                score += kw.includes(" ") ? 2 : 1; // multi-word matches worth more
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestIntent = intent;
        }
    }

    // Question mark override
    if (lower.includes("?") && bestScore < 2) return "question";

    return bestIntent;
}

// ─────────────────────────────────────────────
// 2.  VENDOR  PERSONALITIES
// ─────────────────────────────────────────────

interface VendorPersonality {
    name: string;
    tone: string;
    fillers: string[];        // injected randomly between clauses
    catchphrases: string[];   // appended sometimes
    defaultTopics: string[];  // fallback when memory is thin
}

const VENDOR_PERSONALITIES: Record<string, VendorPersonality> = {
    barker: {
        name: "THE BARKER",
        tone: "gruff",
        fillers: ["listen", "look", "pal", "trust me", "I'm telling you"],
        catchphrases: [
            "This ain't charity, kid.",
            "You won't find better in the whole bazaar.",
            "Time is money, friend.",
            "Come back when you're serious.",
        ],
        defaultTopics: ["bots", "agents", "firmware", "circuits", "trade"],
    },
    broker: {
        name: "THE BROKER",
        tone: "methodical",
        fillers: ["look", "here's the deal", "bottom line", "between us"],
        catchphrases: [
            "Autonomous little bots — built, tuned, hustled.",
            "Custom firmware, no questions asked.",
            "Need a runner? I got runners.",
            "Every unit leaves my bench tested.",
        ],
        defaultTopics: ["bots", "runners", "scouts", "firmware", "prototypes"],
    },
    smith: {
        name: "THE SMITH",
        tone: "stoic",
        fillers: ["hmm", "indeed", "well", "let me think", "ah"],
        catchphrases: [
            "Forged to last.",
            "Quality takes patience.",
            "Every piece tells a story.",
            "The metal remembers.",
        ],
        defaultTopics: ["alloys", "blueprints", "components", "repair", "tools"],
    },
    merchant: {
        name: "THE MERCHANT",
        tone: "sly",
        fillers: ["friend", "between us", "just between you and me", "now here's the thing"],
        catchphrases: [
            "Everything has a price.",
            "Supply and demand, my friend.",
            "I know people who know people.",
            "Let's make a deal.",
        ],
        defaultTopics: ["rare goods", "imports", "contacts", "connections", "information"],
    },
    fixer: {
        name: "THE FIXER",
        tone: "fast",
        fillers: ["right", "okay so", "basically", "thing is"],
        catchphrases: [
            "I can fix that in my sleep.",
            "Broken? Not for long.",
            "Bring it here, I'll sort it out.",
            "Nothing I haven't seen before.",
        ],
        defaultTopics: ["repairs", "diagnostics", "calibration", "firmware", "patches"],
    },
    coder: {
        name: "THE CODER",
        tone: "enthusiastic",
        fillers: ["actually", "so basically", "fun fact", "oh man"],
        catchphrases: [
            "Open source or no source.",
            "KIRA runs local, runs free.",
            "49 tests passing. Ship it.",
            "Zero dependencies, maximum power.",
        ],
        defaultTopics: ["KIRA", "algorithms", "code", "architecture", "agents", "AI"],
    },
};

const DEFAULT_PERSONALITY: VendorPersonality = {
    name: "VENDOR",
    tone: "neutral",
    fillers: ["well", "hmm", "let's see"],
    catchphrases: ["Interesting.", "I see.", "Come again."],
    defaultTopics: ["wares", "goods", "trade"],
};

function getPersonality(vendorId: string): VendorPersonality {
    return VENDOR_PERSONALITIES[vendorId] || DEFAULT_PERSONALITY;
}

// ─────────────────────────────────────────────
// 3.  TEMPLATE  ENGINE
// ─────────────────────────────────────────────

// Templates with slots: {topic}, {memory}, {memory2}, {filler}, {catchphrase}
const TEMPLATES: Record<Intent, string[]> = {
    greeting: [
        "Welcome, traveler. Looking for {topic}?",
        "Hey. You here for {topic} or just passing through?",
        "{filler}... another face in the bazaar. What do you need?",
        "Step right up. I deal in {topic} and {memory}.",
        "You look like someone who knows about {topic}.",
    ],
    farewell: [
        "See you around, traveler.",
        "Come back when you need {topic}. {catchphrase}",
        "Don't be a stranger.",
        "Safe travels. Remember — {catchphrase}",
        "Later. And {filler}, don't forget about {topic}.",
    ],
    question: [
        "Ah, {topic}. I've seen {memory} and {memory2} come through lately.",
        "{filler}, that's a good question. {topic} ties into {memory} more than you'd think.",
        "You're asking about {topic}? Let me think... {memory} is the key.",
        "{topic}? {filler}... it all connects to {memory}.",
        "People keep asking about {topic}. Seems like {memory} is trending.",
    ],
    trade: [
        "{topic}? Might have something. {catchphrase}",
        "{filler}, I got {memory} in stock. Pairs well with {topic}.",
        "You want {topic}? I can do that. But {memory} might be a better pick.",
        "Let's talk {topic}. I've got {memory} and {memory2} on the shelf.",
        "{topic}? That'll cost you. {catchphrase}",
    ],
    help: [
        "You need help with {topic}? {filler}, start with {memory}.",
        "Okay, {topic}. First thing — look into {memory}. Then {memory2}.",
        "{filler}, I've helped plenty of people with {topic}. Key is {memory}.",
        "Lost? {topic} can be tricky. Focus on {memory} first.",
        "For {topic}, I'd say check out {memory}. {catchphrase}",
    ],
    compliment: [
        "Appreciate it. {catchphrase}",
        "Thanks, traveler. Always happy to talk {topic}.",
        "{filler}... that means a lot. Stick around, I know plenty about {memory}.",
        "You're alright. Most people don't appreciate {topic} like that.",
        "Good to hear. {catchphrase}",
    ],
    insult: [
        "{filler}... I've heard worse. {catchphrase}",
        "Say what you want, I still got the best {topic} in the bazaar.",
        "Tough talk. Come back when you know something about {memory}.",
        "{catchphrase} — and that's all I've got to say about that.",
        "You done? Because {topic} isn't gonna handle itself.",
    ],
    opinion: [
        "{filler}, in my experience? {memory} is worth looking into.",
        "My take on {topic}? It comes down to {memory} and {memory2}.",
        "If you ask me, {topic} is evolving. {memory} is the future.",
        "{filler}... honestly? {topic} pairs best with {memory}.",
        "Opinion? {catchphrase} That's where I stand on {topic}.",
    ],
    unknown: [
        "{filler}... interesting. Tell me more about {topic}?",
        "Hmm. I don't hear about {topic} much. But {memory} is related.",
        "Not sure what you mean, but {catchphrase}",
        "{filler}. Let's talk about something I know — like {memory}.",
        "I mostly deal in {topic} around here. Anything specific?",
    ],
};

// ─────────────────────────────────────────────
// 4.  MEMORY  SLOT  FILLER
// ─────────────────────────────────────────────

async function fetchMemoryWords(keywords: string[], limit: number = 10): Promise<string[]> {
    const results: CorrelationData[] = [];

    for (const kw of keywords.slice(0, 3)) { // cap to avoid excessive queries
        const term = kw.toLowerCase();
        const where = { OR: [{ word1: term }, { word2: term }] };

        const long = await prisma.ariaLong.findMany({ where, orderBy: { correlationScore: "desc" }, take: limit });
        const medium = await prisma.ariaMedium.findMany({ where, orderBy: { correlationScore: "desc" }, take: limit });
        results.push(...long, ...medium);
    }

    // Extract the non-input words, deduplicate, sort by strength
    const inputSet = new Set(keywords.map(k => k.toLowerCase()));
    const wordScores = new Map<string, number>();

    for (const r of results) {
        const other = inputSet.has(r.word1) ? r.word2 : r.word1;
        if (inputSet.has(other)) continue; // skip if both are user keywords
        const existing = wordScores.get(other) || 0;
        wordScores.set(other, Math.max(existing, r.correlationScore));
    }

    return Array.from(wordScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);
}

// ─────────────────────────────────────────────
// 5.  RESPONSE  ASSEMBLER
// ─────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(
    template: string,
    topic: string,
    memoryWords: string[],
    personality: VendorPersonality
): string {
    let result = template;

    // {topic}
    result = result.replace(/\{topic\}/g, topic);

    // {memory} — first available memory word, or fallback
    const mem1 = memoryWords[0] || pickRandom(personality.defaultTopics);
    result = result.replace(/\{memory\}/, mem1);

    // {memory2} — second word, different from first
    const mem2 = memoryWords.find(w => w !== mem1) || pickRandom(personality.defaultTopics.filter(t => t !== mem1)) || "stuff";
    result = result.replace(/\{memory2\}/, mem2);

    // {filler}
    result = result.replace(/\{filler\}/g, pickRandom(personality.fillers));

    // {catchphrase}
    result = result.replace(/\{catchphrase\}/g, pickRandom(personality.catchphrases));

    // Capitalize first letter
    result = result.charAt(0).toUpperCase() + result.slice(1);

    return result;
}

function extractTopicFromInput(text: string, keywords: string[]): string {
    // Use the most "interesting" keyword (longest, not a stopword)
    const STOPWORDS = new Set(["the", "is", "are", "was", "were", "what", "where", "how", "why", "when", "who", "do", "does", "can", "you", "your", "my", "it", "this", "that", "have", "has", "any", "some", "about"]);

    const candidates = keywords.filter(k => k.length >= 3 && !STOPWORDS.has(k));

    if (candidates.length > 0) {
        // Prefer longer words (more specific)
        candidates.sort((a, b) => b.length - a.length);
        return candidates[0];
    }

    // Fallback: extract the last few meaningful words
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
    return words[words.length - 1] || "things";
}

// ─────────────────────────────────────────────
// 6.  MAIN  EXPORT
// ─────────────────────────────────────────────

export async function generateResponse(input: string, vendorId: string = "barker"): Promise<string> {
    if (!input.trim()) return "...";

    const personality = getPersonality(vendorId);
    const intent = detectIntent(input);
    const keywords = tokenizeMessage(input).map(t => t.word);

    // Fetch memory associations
    const memoryWords = await fetchMemoryWords(keywords);

    // Determine topic
    const topic = extractTopicFromInput(input, keywords);

    // Pick and fill template
    const templates = TEMPLATES[intent];
    const template = pickRandom(templates);
    const response = fillTemplate(template, topic, memoryWords, personality);

    return response;
}
