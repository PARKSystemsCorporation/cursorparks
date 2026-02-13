/**
 * EXOKIN Autonomous Regulation Engine (EARE).
 * Self-regulating layer above morphology, color, and AI chat.
 */

export { EAREEngine } from "./eareEngine";
export type { EAREOptions, EAREState, LifetimeMetrics } from "./eareEngine";
export type {
  PhysicalLayer,
  VisualLayer,
  BehavioralLayer,
  NeurochemLayer,
  RoleDrift,
  CombatCalibration,
  EAREChatContext,
  EAREEventType,
} from "./types";

export { ExokinPanel } from "./ExokinPanel";
export { ExokinChat } from "./ExokinChat";
