/**
 * Response construction pipeline: perception -> memory lookup -> correlation ranking
 * -> proto-word injection (optional) -> tone selection -> phrase assembly.
 */

import type { NpcDb } from "./brain";
import { getCorrelationClusters, mergeAriaWordsIntoClusters } from "./correlation";
import { getTopProtoWords } from "./protoLanguage";
import { computeToneBias, selectToneFromBias, getToneModifier } from "./tone";
import { computeSocialOverlap } from "./social";
import { buildEnvironmentContext } from "./environment";
import type { EnvironmentContext } from "./types";

const PROTO_INJECTION_CHANCE = 0.15;

/**
 * Build a response for an NPC: correlation-driven phrase with optional proto-word and tone.
 * Used by cognitive loop (no user input) and by chat API (with user input; generator does the rest).
 */
export function constructResponse(params: {
  database: NpcDb;
  npcId: string;
  inputText?: string | null;
  environmentContext?: EnvironmentContext | null;
  playerFrequencySeen?: number;
  /** If true, allow proto-word injection. */
  allowProto?: boolean;
}): string {
  const env = params.environmentContext ?? buildEnvironmentContext({});
  const clusters = getCorrelationClusters(params.database, {
    npcId: params.npcId,
    inputWords: params.inputText ? params.inputText.toLowerCase().split(/\s+/).filter((w) => w.length >= 2) : [],
    environmentContext: env,
    socialOverlap: 0,
  });

  const top = clusters[0];
  const words = top?.words ?? ["wares", "trade"];
  const socialOverlap = computeSocialOverlap(params.database, params.npcId, words);
  const merged = getCorrelationClusters(params.database, {
    npcId: params.npcId,
    inputWords: params.inputText?.toLowerCase().split(/\s+/).filter((w) => w.length >= 2),
    environmentContext: env,
    socialOverlap,
  });
  const best = merged[0];
  const clusterWords = best?.words ?? words;

  let phrase = clusterWords.slice(0, 3).join(" ");
  if (params.allowProto && Math.random() < PROTO_INJECTION_CHANCE) {
    const protos = getTopProtoWords(params.database, { npcId: params.npcId, limit: 3 });
    if (protos[0]) {
      phrase = phrase ? `${phrase} ${protos[0].word}` : protos[0].word;
    }
  }

  const bias = computeToneBias({
    playerFrequencySeen: params.playerFrequencySeen ?? 0,
    environmentDensity: env.entityDensity,
    npcSocialPressure: socialOverlap,
  });
  const tone = selectToneFromBias(bias.bias);
  const modifier = getToneModifier(tone);

  const parts: string[] = [];
  if (modifier && modifier !== "neutral") parts.push(modifier);
  parts.push(phrase);
  const out = parts.join(", ").trim();
  return out.charAt(0).toUpperCase() + out.slice(1) + (out.endsWith(".") ? "" : ".");
}
