/**
 * Companion creature weight tables.
 * Bias: round, soft. Used for non-combat / companion creatures.
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

/** Frame: orb 30, quadruped 30, biped 20, floating 15, other 5 each */
const FRAME_WEIGHTS = {
  orb: 30,
  quadruped: 30,
  biped: 20,
  floating: 15,
  crawler: 5,
  longform: 5,
  stacked: 5,
};

/** Limbs: paw, stub, tentacle */
const LIMB_WEIGHTS = {
  paw: 35,
  stub: 35,
  tentacle: 20,
  hand: 5,
  claw: 2,
  blade: 1,
  wheel: 1,
  none: 1,
};

/** Sensors: balanced, slight bias to audio dome / antenna for “friendly” */
const SENSOR_WEIGHTS = {
  "mono optic": 14,
  "dual optic": 16,
  visor: 14,
  "cluster eyes": 16,
  "audio dome": 20,
  antenna: 20,
};

/** Surface: synth skin, rubber, cloth wrap */
const SURFACE_WEIGHTS = {
  "synth skin": 35,
  rubber: 25,
  "cloth wrap": 25,
  fiber: 10,
  "matte alloy": 3,
  "metal plate": 2,
};

/** Movement: roll, pad, hover */
const MOVEMENT_WEIGHTS = {
  roll: 35,
  pad: 35,
  hover: 25,
  stomp: 2,
  glide: 2,
  twitch: 1,
};

const BEHAVIOR_FLAGS = ["curious", "loyal", "avoidant"];

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
