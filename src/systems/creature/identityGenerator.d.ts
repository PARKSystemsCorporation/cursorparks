export interface CreatureIdentity {
  gender: string;
  role: string;
  head_type: string;
  body_type: string;
  tail_type: string;
  color_profile: Record<string, unknown>;
}

export function generateIdentity(
  type: string,
  seed?: number,
  override?: { gender?: string }
): CreatureIdentity;

export function getIdentity(creatureId: string): CreatureIdentity | null;

export function setIdentity(creatureId: string, identity: CreatureIdentity): void;

export function getOrCreateIdentity(
  creatureId: string,
  type: string,
  seed?: number,
  opts?: { gender?: string }
): CreatureIdentity;

export function createSeededRng(seed: number): () => number;
