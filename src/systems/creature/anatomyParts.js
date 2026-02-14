/**
 * Modular anatomy: HEAD, BODY, TAIL. Mechanical constructs, not species.
 * Expanded variants per category. Randomized per (gender, role) on first deploy.
 */

const HEAD_TYPES = ["sensor_dome", "narrow_visor", "antenna_cluster", "prism_head", "split_orb"];
const BODY_TYPES = ["slug_form", "dog_frame", "crawler_plate", "beetle_core", "tripod_chassis"];
const TAIL_TYPES = ["cable_tail", "blade_tail", "stabilizer_tail", "fin_array", "coil_whip"];

const GENDERS = ["male", "female"];
const ROLES = ["warrior", "companion"];

function headOptions() {
  return HEAD_TYPES;
}

function bodyOptions() {
  return BODY_TYPES;
}

function tailOptions() {
  return TAIL_TYPES;
}

module.exports = {
  HEAD_TYPES,
  BODY_TYPES,
  TAIL_TYPES,
  GENDERS,
  ROLES,
  headOptions,
  bodyOptions,
  tailOptions,
};
