/**
 * Proto-language generator: prefix + root + suffix.
 * Pronounceability constraints, reuse of phonetics, reinforcement on use.
 */

import type { NpcDb } from "./brain";
import type { ProtoWord } from "./types";

const VOWELS = new Set("aeiou");
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz");

function isVowel(c: string): boolean {
  return VOWELS.has(c.toLowerCase());
}

function isConsonant(c: string): boolean {
  return CONSONANTS.has(c.toLowerCase());
}

/** No triple consonants, at least one vowel per 4 chars, max 2 consecutive same letter. */
export function isPronounceable(word: string): boolean {
  if (!word || word.length < 2 || word.length > 20) return false;
  const w = word.toLowerCase();
  let consonantRun = 0;
  let vowelCount = 0;
  let last = "";
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (c === last && isConsonant(c)) return false; // no double consonant (allow double vowel like "ee")
    if (isConsonant(c)) {
      consonantRun++;
      if (consonantRun >= 3) return false;
    } else if (isVowel(c)) {
      consonantRun = 0;
      vowelCount++;
    }
    last = c;
  }
  if (vowelCount === 0) return false;
  if (w.length >= 4 && vowelCount < Math.floor(w.length / 4)) return false;
  return true;
}

const DEFAULT_PREFIXES = ["re", "un", "de", "pre", "pro", "syn", "cy", "neo", "ex", "in"];
const DEFAULT_SUFFIXES = ["ex", "or", "ion", "ive", "ent", "ant", "oid", "ite", "ine", "ar"];
const DEFAULT_ROOTS = [
  "tek", "mod", "flux", "core", "vec", "nex", "volt", "synth", "data", "code",
  "run", "net", "link", "node", "grid", "cell", "byte", "bit", "logic", "path",
];

let seeded = false;

function seedIfNeeded(database: NpcDb): void {
  if (seeded) return;
  const count = database.prepare("SELECT COUNT(*) as c FROM root_words").get() as { c: number };
  if (count.c > 0) {
    seeded = true;
    return;
  }
  for (const root of DEFAULT_ROOTS) {
    database.prepare(
      "INSERT INTO root_words (phonetic_seed, semantic_vector_tag, usage_frequency) VALUES (?, ?, 0)"
    ).run(root, "default");
  }
  for (const p of DEFAULT_PREFIXES) {
    database.prepare("INSERT INTO prefixes (prefix, functional_tag) VALUES (?, ?)").run(p, "default");
  }
  for (const s of DEFAULT_SUFFIXES) {
    database.prepare("INSERT INTO suffixes (suffix, functional_tag) VALUES (?, ?)").run(s, "default");
  }
  seeded = true;
}

/**
 * Generate a novel proto-word: prefix + root + suffix.
 * Tries to stay pronounceable; may try multiple combinations.
 */
export function generateProtoWord(
  database: NpcDb,
  options?: { npcId?: string; semanticTag?: string }
): ProtoWord | null {
  seedIfNeeded(database);

  const prefixes = database.prepare("SELECT prefix FROM prefixes ORDER BY RANDOM() LIMIT 5").all() as { prefix: string }[];
  const roots = database.prepare("SELECT phonetic_seed FROM root_words ORDER BY RANDOM() LIMIT 5").all() as { phonetic_seed: string }[];
  const suffixes = database.prepare("SELECT suffix FROM suffixes ORDER BY RANDOM() LIMIT 5").all() as { suffix: string }[];

  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const prefix = prefixes[i % prefixes.length]?.prefix ?? "";
    const root = roots[Math.floor(i / 3) % roots.length]?.phonetic_seed ?? "nex";
    const suffix = suffixes[i % suffixes.length]?.suffix ?? "";
    const word = (prefix + root + suffix).toLowerCase();
    if (!isPronounceable(word)) continue;

    const existing = database.prepare("SELECT word FROM proto_vocabulary WHERE word = ?").get(word);
    if (existing) continue;

    database.prepare(
      `INSERT INTO proto_vocabulary (word, prefix, root, suffix, semantic_tag, reinforcement_score, first_created, last_used, created_by_npc)
       VALUES (?, ?, ?, ?, ?, 0.5, ?, ?, ?)`
    ).run(word, prefix || null, root, suffix || null, options?.semanticTag ?? null, now, now, options?.npcId ?? null);

    return {
      word,
      prefix: prefix || null,
      root,
      suffix: suffix || null,
      semantic_tag: options?.semanticTag ?? null,
      reinforcement_score: 0.5,
    };
  }
  return null;
}

/**
 * Get an existing proto-word by semantic tag or high reinforcement; optionally create one.
 */
export function getOrCreateProtoWord(
  database: NpcDb,
  npcId: string,
  semanticTag: string
): ProtoWord | null {
  seedIfNeeded(database);

  const existing = database
    .prepare(
      "SELECT word, prefix, root, suffix, semantic_tag, reinforcement_score FROM proto_vocabulary WHERE semantic_tag = ? ORDER BY reinforcement_score DESC, last_used DESC LIMIT 1"
    )
    .get(semanticTag) as { word: string; prefix: string | null; root: string; suffix: string | null; semantic_tag: string | null; reinforcement_score: number } | undefined;

  if (existing) {
    return {
      word: existing.word,
      prefix: existing.prefix,
      root: existing.root,
      suffix: existing.suffix,
      semantic_tag: existing.semantic_tag,
      reinforcement_score: existing.reinforcement_score,
    };
  }

  const created = generateProtoWord(database, { npcId, semanticTag });
  if (created) {
    database.prepare("UPDATE proto_vocabulary SET created_by_npc = ? WHERE word = ?").run(npcId, created.word);
  }
  return created;
}

/**
 * Record use of a proto-word: bump reinforcement and last_used.
 */
export function reinforceProtoWord(database: NpcDb, word: string, delta: number = 0.05): void {
  const now = Date.now();
  const row = database.prepare("SELECT reinforcement_score FROM proto_vocabulary WHERE word = ?").get(word) as { reinforcement_score: number } | undefined;
  if (!row) return;
  const newScore = Math.min(1, row.reinforcement_score + delta);
  database.prepare("UPDATE proto_vocabulary SET reinforcement_score = ?, last_used = ? WHERE word = ?").run(newScore, now, word);
}

/**
 * Get top proto-words for an NPC or globally (for injection into responses).
 */
export function getTopProtoWords(
  database: NpcDb,
  options?: { npcId?: string; limit?: number }
): ProtoWord[] {
  seedIfNeeded(database);
  const limit = options?.limit ?? 10;
  const rows = options?.npcId
    ? (database
        .prepare(
          "SELECT word, prefix, root, suffix, semantic_tag, reinforcement_score FROM proto_vocabulary WHERE created_by_npc = ? OR last_used > 0 ORDER BY reinforcement_score DESC LIMIT ?"
        )
        .all(options.npcId, limit) as { word: string; prefix: string | null; root: string; suffix: string | null; semantic_tag: string | null; reinforcement_score: number }[])
    : (database
        .prepare(
          "SELECT word, prefix, root, suffix, semantic_tag, reinforcement_score FROM proto_vocabulary ORDER BY reinforcement_score DESC, last_used DESC LIMIT ?"
        )
        .all(limit) as { word: string; prefix: string | null; root: string; suffix: string | null; semantic_tag: string | null; reinforcement_score: number }[]);

  return rows.map((r) => ({
    word: r.word,
    prefix: r.prefix,
    root: r.root,
    suffix: r.suffix,
    semantic_tag: r.semantic_tag,
    reinforcement_score: r.reinforcement_score,
  }));
}
