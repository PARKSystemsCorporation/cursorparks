/**
 * Warform creature weight tables.
 * Bias: aggressive, lean. Used for combat/alert creatures.
 */

const FRAMES = [
  "biped",
  "quadruped",
  "crawler",
  "floating",
  "orb",
  "longform",
  "stacked",
];

const LIMBS = [
  "claw",
  "hand",
  "blade",
  "paw",
  "tentacle",
  "stub",
  "wheel",
  "none",
];

const SENSORS = [
  "mono optic",
  "dual optic",
  "visor",
  "cluster eyes",
  "audio dome",
  "antenna",
];

const SURFACES = [
  "metal plate",
  "matte alloy",
  "fiber",
  "synth skin",
  "rubber",
  "cloth wrap",
];

const MOVEMENTS = [
  "stomp",
  "glide",
  "twitch",
  "roll",
  "hover",
  "pad",
];

/** Frame: biped 40, quadruped 25, crawler 20, floating 10, other 5 each */
const FRAME_WEIGHTS = {
  biped: 40,
  quadruped: 25,
  crawler: 20,
  floating: 10,
  orb: 5,
  longform: 5,
  stacked: 5,
};

/** Limbs: blade high, claw high, hand medium */
const LIMB_WEIGHTS = {
  blade: 35,
  claw: 35,
  hand: 20,
  paw: 3,
  tentacle: 3,
  stub: 2,
  wheel: 1,
  none: 1,
};

/** Sensors: slight bias for alert/combat (visor, dual optic); rest moderate */
const SENSOR_WEIGHTS = {
  "mono optic": 12,
  "dual optic": 22,
  visor: 22,
  "cluster eyes": 15,
  "audio dome": 15,
  antenna: 14,
};

/** Surface: alloy high, plate high, fiber medium */
const SURFACE_WEIGHTS = {
  "metal plate": 35,
  "matte alloy": 35,
  fiber: 20,
  "synth skin": 4,
  rubber: 3,
  "cloth wrap": 3,
};

/** Movement: twitch, stomp */
const MOVEMENT_WEIGHTS = {
  twitch: 45,
  stomp: 45,
  glide: 3,
  roll: 2,
  hover: 3,
  pad: 2,
};

const BEHAVIOR_FLAGS = ["aggressive", "alert", "defensive"];

module.exports = {
  FRAMES,
  LIMBS,
  SENSORS,
  SURFACES,
  MOVEMENTS,
  FRAME_WEIGHTS,
  LIMB_WEIGHTS,
  SENSOR_WEIGHTS,
  SURFACE_WEIGHTS,
  MOVEMENT_WEIGHTS,
  BEHAVIOR_FLAGS,
};
