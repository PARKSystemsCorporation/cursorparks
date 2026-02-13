/**
 * EXOKIN unified speech: EARE → Intent → Proto-Language → surface output.
 * Primary speech construction for the species. Templates are fallback only.
 * One cognitive pipeline: no NPC vs companion split.
 */

import type { EAREChatContext, NeurochemLayer } from "./types";

/** Morphology/color influence on speech (optional, from identity). */
export interface SpeechMorphology {
  /** Angular/heavy → harsher phonetics; smooth/adaptive → fluid. */
  structuralBias?: "angular" | "smooth" | "neutral";
  /** Cold → concise; warm → expressive. */
  colorWarmth?: number;
}

const VOWELS = new Set("aeiou");
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz");

function isPronounceable(word: string): boolean {
  if (!word || word.length < 2 || word.length > 18) return false;
  const w = word.toLowerCase();
  let consonantRun = 0;
  let vowelCount = 0;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (CONSONANTS.has(c)) {
      consonantRun++;
      if (consonantRun >= 3) return false;
    } else if (VOWELS.has(c)) {
      consonantRun = 0;
      vowelCount++;
    }
  }
  return vowelCount >= 1 && (w.length < 4 || vowelCount >= Math.floor(w.length / 4));
}

/** Harsher phonetics: angular builds, high aggression. */
const ROOTS_HARSH = ["tek", "krax", "vex", "nox", "volt", "synk", "takt", "flux", "kore", "nex", "vex", "zil"];
/** Fluid phonetics: smooth builds, high bonding. */
const ROOTS_FLUID = ["syn", "lum", "vel", "mer", "sol", "flo", "rel", "nov", "ser", "mel", "ven", "lor"];
/** Neutral / general. */
const ROOTS_NEUTRAL = ["mod", "core", "vec", "run", "net", "link", "path", "node", "data", "code", "bit", "cell"];

const PREFIXES_SHORT = ["re", "un", "de", "ex", "in", "cy", "pro"];
const PREFIXES_LONG = ["pre", "syn", "neo", "meta", "hyper"];
const SUFFIXES_CLIP = ["ex", "or", "ix", "ax"];
const SUFFIXES_SMOOTH = ["ive", "ent", "ine", "ion", "ar", "oid"];
const SUFFIXES_NEUTRAL = ["ant", "ite", "ive", "ent", "ion", "ar"];

/** EARE-driven speech params derived from context. */
function getSpeechParams(ctx: EAREChatContext, morphology?: SpeechMorphology) {
  const n = ctx.neuro;
  const aggression = n.aggression;
  const bonding = n.bonding;
  const curiosity = n.curiosity;
  const alertness = n.alertness;
  const dominance = ctx.dominance;
  const valence = ctx.valence;

  const structuralBias = morphology?.structuralBias ?? "neutral";
  const colorWarmth = morphology?.colorWarmth ?? 0.5;

  const useHarshRoots = structuralBias === "angular" || aggression > 0.6;
  const useFluidRoots = structuralBias === "smooth" || bonding > 0.55;
  const concise = colorWarmth < 0.4 || aggression > 0.55;
  const expressive = colorWarmth > 0.6 || bonding > 0.6;

  const wordCount =
    aggression > 0.7 ? 1 : alertness < 0.3 ? 1 : bonding > 0.6 ? 3 + (expressive ? 1 : 0) : 2;
  const questionWeight = curiosity > 0.5 ? 0.4 : 0.1;
  const fragment = aggression > 0.65 || dominance > 0.7;

  return {
    wordCount: Math.max(1, Math.min(4, wordCount)),
    useHarshRoots,
    useFluidRoots,
    concise,
    expressive,
    questionWeight,
    fragment,
    rootsHarsh: ROOTS_HARSH,
    rootsFluid: ROOTS_FLUID,
    rootsNeutral: ROOTS_NEUTRAL,
  };
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

/** Build one proto-word from prefix + root + suffix. */
function buildProtoWord(
  params: ReturnType<typeof getSpeechParams>,
  seedRef: { s: number }
): string {
  const next = () => {
    seedRef.s = (seedRef.s * 9301 + 49297) % 233280;
    return seedRef.s / 233280;
  };
  const roots = params.useFluidRoots
    ? [...params.rootsFluid, ...params.rootsNeutral]
    : params.useHarshRoots
      ? [...params.rootsHarsh, ...params.rootsNeutral]
      : params.rootsNeutral;
  const prefixList = params.concise ? PREFIXES_SHORT : [...PREFIXES_SHORT, ...PREFIXES_LONG];
  const suffixList = params.concise
    ? SUFFIXES_CLIP
    : params.expressive
      ? SUFFIXES_SMOOTH
      : SUFFIXES_NEUTRAL;

  for (let attempt = 0; attempt < 12; attempt++) {
    const prefix = params.concise && next() < 0.5 ? "" : pick(prefixList, next());
    const root = pick(roots, next());
    const suffix = pick(suffixList, next());
    const word = (prefix + root + suffix).toLowerCase();
    if (isPronounceable(word)) return word;
  }
  return pick(params.rootsNeutral, next());
}

/** Generate a phrase: 1–4 proto words, optionally question, surface-formatted. */
export function generateProtoPhrase(
  intent: string,
  context: EAREChatContext,
  options?: {
    morphology?: SpeechMorphology;
    seed?: number;
    templatesAsFallback?: string[];
  }
): { text: string; fromProto: boolean } {
  const seedRef = { s: options?.seed ?? (Date.now() % 233280) };
  const params = getSpeechParams(context, options?.morphology);

  const next = () => {
    seedRef.s = (seedRef.s * 9301 + 49297) % 233280;
    return seedRef.s / 233280;
  };

  const words: string[] = [];
  for (let i = 0; i < params.wordCount; i++) {
    words.push(buildProtoWord(params, seedRef));
  }

  const raw = words.join(" ");
  const isQuestion = next() < params.questionWeight;
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
  const surface = params.fragment ? cap : cap + (isQuestion ? "?" : ".");

  if (surface.length < 2 || surface.length > 120) {
    const fallback = options?.templatesAsFallback;
    if (fallback?.length) {
      const idx = Math.floor(next() * fallback.length) % fallback.length;
      return { text: fallback[idx]!, fromProto: false };
    }
    return { text: "Ack.", fromProto: false };
  }

  return { text: surface, fromProto: true };
}

/** Intent-to-semantic hint for proto (optional future: map intent to root bias). */
export const INTENT_PROTO_HINT: Record<string, "social" | "tactical" | "neutral"> = {
  greet: "social",
  praise: "social",
  insult: "neutral",
  command_follow: "social",
  command_wait: "neutral",
  command_train: "tactical",
  command_fight: "tactical",
  info: "neutral",
  joke: "social",
  unknown: "neutral",
};

/** Identity-like shape for morphology derivation (companion, NPC, or any EXOKIN identity). */
export interface IdentityLike {
  body_type?: string;
  head_type?: string;
  color_profile?: Record<string, unknown> | { primary?: string; emissive?: string; emissiveIntensity?: number };
}

/** Derive speech morphology from creature identity: angular vs smooth, cold vs warm. */
export function morphologyFromIdentity(identity: IdentityLike | null | undefined): SpeechMorphology | undefined {
  if (!identity) return undefined;
  const body = identity.body_type ?? "";
  const head = identity.head_type ?? "";
  const angularBodies = ["crawler_plate", "dog_frame"];
  const smoothBodies = ["slug_form"];
  const angularHeads = ["narrow_visor", "antenna_cluster"];
  const smoothHeads = ["sensor_dome"];
  const isAngular = angularBodies.includes(body) || angularHeads.includes(head);
  const isSmooth = smoothBodies.includes(body) || smoothHeads.includes(head);
  const structuralBias = isAngular ? "angular" : isSmooth ? "smooth" : "neutral";

  const cp = identity.color_profile as { primary?: string; emissive?: string; emissiveIntensity?: number } | undefined;
  const primary = cp?.primary ?? "";
  const emissive = cp?.emissive ?? "";
  const intensity = cp?.emissiveIntensity ?? 0;
  const hexToWarmth = (hex: string): number => {
    if (!hex || hex.length < 4) return 0.5;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const warm = (r + g * 0.5) / (r + g + b + 1e-6);
    return Math.max(0, Math.min(1, warm * 1.2));
  };
  const colorWarmth = (hexToWarmth(primary) + hexToWarmth(emissive)) / 2 + intensity * 0.3;

  return { structuralBias, colorWarmth: Math.max(0, Math.min(1, colorWarmth)) };
}
