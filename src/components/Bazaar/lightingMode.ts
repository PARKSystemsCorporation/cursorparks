// Single switch for Bazaar scene lighting: day = high-sun daylight, night = dusk/cyberpunk.
export const BAZAAR_LIGHTING_MODE: "day" | "night" = "day";

export const PRACTICAL_LIGHT_INTENSITY = BAZAAR_LIGHTING_MODE === "day" ? 0 : 1;
export const EMISSIVE_SCALE = BAZAAR_LIGHTING_MODE === "day" ? 0 : 1;
