// Single knob for overall Bazaar landing brightness.
// 3 means ~3x brighter than the current baseline.
export const BAZAAR_BRIGHTNESS = 3;

export function scaleBazaarBrightness(value: number) {
    return value * BAZAAR_BRIGHTNESS;
}

