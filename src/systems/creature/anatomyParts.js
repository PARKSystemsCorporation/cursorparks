/**
 * Modular anatomy: HEAD, BODY, TAIL. Mechanical constructs, not species.
 * 3 base variants per category. Randomized per (gender, role) on first deploy.
 */

const HEAD_TYPES = ["sensor_dome", "narrow_visor", "antenna_cluster"];
const BODY_TYPES = ["slug_form", "dog_frame", "crawler_plate"];
const TAIL_TYPES = ["cable_tail", "blade_tail", "stabilizer_tail"];

const GENDERS = ["male", "female"];
const ROLES = ["warrior", "companion"];

function headOptions(_gender, _role) {
  return HEAD_TYPES;
}

function bodyOptions(_gender, _role) {
  return BODY_TYPES;
}

function tailOptions(_gender, _role) {
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
