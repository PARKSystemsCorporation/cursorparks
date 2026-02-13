/**
 * Lightweight deterministic robot chat: intent -> context -> template response.
 * Events feed into NeurochemEngine.
 */

import type { MoodState } from "./neurochemEngine";
import type { NeurochemEngine } from "./neurochemEngine";
import type { RobotMemory } from "./memorySystem";

export type Intent =
  | "greet"
  | "info"
  | "joke"
  | "praise"
  | "insult"
  | "command_follow"
  | "command_wait"
  | "command_train"
  | "command_fight"
  | "unknown";

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  greet: ["hi", "hello", "hey", "yo", "howdy", "greetings"],
  info: ["what", "who", "where", "when", "why", "how", "tell", "explain", "know"],
  joke: ["joke", "funny", "laugh", "humor", "kidding"],
  praise: ["good", "great", "nice", "thanks", "thank you", "awesome", "love", "best", "amazing"],
  insult: ["bad", "stupid", "dumb", "hate", "worst", "suck", "terrible", "ugly"],
  command_follow: ["follow", "come", "with me", "stay close"],
  command_wait: ["wait", "stay", "stop", "hold"],
  command_train: ["train", "practice", "learn", "training"],
  command_fight: ["fight", "battle", "arena", "combat"],
  unknown: [],
};

const TEMPLATES: Record<Intent, string[]> = {
  greet: ["Hey. Ready when you are.", "Here.", "Hi. What do you need?", "Hello. I'm with you."],
  info: ["I'm not sure. Want to try the bazaar?", "I keep that in mind.", "Could ask a vendor.", "Still learning that one."],
  joke: ["I'd tell a joke but my timing is in milliseconds.", "Why did the robot go to the bazaar? Parts.", "No comment."],
  praise: ["Thanks. That helps.", "I appreciate it.", "Noted. I'll keep it up.", "Glad to hear it."],
  insult: ["I'll try harder.", "Understood.", "Noted.", "Okay."],
  command_follow: ["Following.", "On it.", "Right behind you.", "Here I am."],
  command_wait: ["Waiting.", "Staying put.", "Stopped.", "Okay."],
  command_train: ["Training mode. Let's go.", "Ready to train.", "Practice run.", "Sure."],
  command_fight: ["Arena. I'm ready.", "Fight mode.", "Let's go.", "Ready when you are."],
  unknown: ["I didn't catch that.", "Try again?", "Say more?", "Hmm."],
};

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase().trim();
  if (lower.length === 0) return "unknown";
  const words = lower.split(/\s+/);
  let best: Intent = "unknown";
  let bestScore = 0;
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === "unknown") continue;
    let score = 0;
    for (const w of words) {
      if (keywords.some((k) => w.includes(k) || k.includes(w))) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent as Intent;
    }
  }
  return best;
}

function scoreCandidate(
  candidate: string,
  intent: Intent,
  mood: MoodState,
  recent: string[]
): number {
  let score = 0.5;
  if (candidate.length < 80) score += 0.2;
  if (candidate.length < 40) score += 0.1;
  if (!recent.includes(candidate)) score += 0.2;
  if (mood.valence > 0.5 && (intent === "praise" || intent === "greet")) score += 0.1;
  if (mood.valence < 0.5 && intent === "insult") score += 0.1;
  return score;
}

export interface RobotChatEngineOptions {
  neurochem: NeurochemEngine;
  memory: RobotMemory;
  relationshipScore?: number;
}

export class RobotChatEngine {
  private neurochem: NeurochemEngine;
  private memory: RobotMemory;
  private relationshipScore: number;
  private recentResponses: string[] = [];
  private readonly RECENT_MAX = 10;

  constructor(opts: RobotChatEngineOptions) {
    this.neurochem = opts.neurochem;
    this.memory = opts.memory;
    this.relationshipScore = opts.relationshipScore ?? 0.5;
  }

  respond(userText: string): string {
    this.memory.pushSTM("user", userText);
    const intent = detectIntent(userText);
    const mood = this.neurochem.getMood();
    this.memory.getSTM(5);
    this.memory.retrieveLTM(userText, 3);
    const templates = TEMPLATES[intent];
    const candidates = templates.map((t) => (t.includes("?") ? t : t));
    const withContext = candidates.slice(0, 12);
    const scored = withContext.map((c) => ({
      text: c,
      score: scoreCandidate(c, intent, mood, this.recentResponses),
    }));
    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0]?.text ?? "Okay.";
    this.recentResponses.push(chosen);
    if (this.recentResponses.length > this.RECENT_MAX) this.recentResponses.shift();
    this.memory.pushSTM("robot", chosen);

    if (intent === "praise") this.neurochem.applyEvent("praise", 0.7);
    else if (intent === "insult") this.neurochem.applyEvent("insult", 0.7);
    else if (intent === "greet" || intent === "command_follow") this.neurochem.applyEvent("calm", 0.3);

    return chosen;
  }

  tick(dt: number): void {
    this.neurochem.tick(dt);
  }
}
