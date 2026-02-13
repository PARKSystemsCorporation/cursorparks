/**
 * Cognitive state loop: perceive -> updateMemory -> computeCorrelations -> optionallySpeak -> decayOldMemory.
 * Run every 2–5s per NPC (server-side).
 */

import type { NpcDb } from "./brain";
import type { Server as SocketIOServer } from "socket.io";
import { insertShort } from "./memory";
import { decayShort, decayMid } from "./memory";
import { recordNpcPhrase } from "./social";
import { constructResponse } from "./response";
import { buildEnvironmentContext } from "./environment";

const SPEAK_CHANCE_PER_TICK = 0.2;
const DECAY_SHORT_EVERY_TICKS = 3;
const DECAY_MID_EVERY_TICKS = 5;

export interface PerceptionPayload {
  npcId: string;
  actionObserved?: string;
  entitySeen?: string;
  phraseHeard?: string;
  sceneId?: string;
  timestamp?: number;
}

/** Apply a single perception event to short memory (call when server receives npc:perceive). */
export function applyPerception(
  database: NpcDb,
  payload: PerceptionPayload
): void {
  insertShort(database, payload.npcId, {
    entitySeen: payload.entitySeen ?? undefined,
    phraseHeard: payload.phraseHeard ?? undefined,
    actionObserved: payload.actionObserved ?? undefined,
  });
}

/**
 * Run one cognitive tick for one NPC: optionally speak, then decay.
 * io: Socket.IO server to emit npc:speak.
 */
export function runCognitiveTick(
  database: NpcDb,
  npcId: string,
  io: SocketIOServer | null,
  options: {
    environmentContext?: { timePhase: number; entityDensity: number; sceneId: string };
    tickIndex?: number;
  }
): void {
  const tickIndex = options.tickIndex ?? 0;
  const env = options.environmentContext
    ? buildEnvironmentContext(options.environmentContext)
    : buildEnvironmentContext({});

  if (io && Math.random() < SPEAK_CHANCE_PER_TICK) {
    const phrase = constructResponse({
      database,
      npcId,
      environmentContext: env,
      allowProto: true,
    });
    if (phrase && phrase !== ".") {
      io.emit("npc:speak", { npcId, text: phrase });
      recordNpcPhrase(database, npcId, phrase);
    }
  }

  if (tickIndex % DECAY_SHORT_EVERY_TICKS === 0) {
    decayShort(database);
  }
  if (tickIndex % DECAY_MID_EVERY_TICKS === 0) {
    decayMid(database);
  }
}

/**
 * Run cognitive ticks for all given NPCs. Call from server setInterval with staggered offsets.
 */
export function runCognitiveTicksForAll(
  database: NpcDb,
  npcIds: string[],
  io: SocketIOServer | null,
  options: {
    timePhase?: number;
    entityDensity?: number;
    tickIndex?: number;
  }
): void {
  const tickIndex = options.tickIndex ?? 0;
  const env = {
    timePhase: options.timePhase ?? 0.5,
    entityDensity: options.entityDensity ?? 0,
    sceneId: "bazaar",
  };
  npcIds.forEach((npcId, i) => {
    runCognitiveTick(database, npcId, io, {
      environmentContext: env,
      tickIndex: tickIndex + i,
    });
  });
}
