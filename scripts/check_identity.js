
// Manually replicating identityGenerator.ts logic since we can't import TS in node easily

const seed = 'test-seed-123';
const type = 'companion';
const gender = 'male';

console.log(`Testing identity generation for seed: ${seed}`);

// Simple pseudo-random generator from identityGenerator.ts (sfc32)
function sfc32(a, b, c, d) {
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    }
}

// Seed cyrb128
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

const seedParts = cyrb128(seed);
const rand = sfc32(seedParts[0], seedParts[1], seedParts[2], seedParts[3]);

console.log('Random values:', rand(), rand(), rand());

// Simulate selection
const HEAD_TYPES = ['round', 'angular', 'flat', 'cranial'];
const BODY_TYPES = ['lithe', 'bulky', 'segmented', 'smooth'];
const TAIL_TYPES = ['stub', 'long', 'plumed', 'none'];
const PALETTES = [
    { name: 'Terra', primary: '#8b4513', secondary: '#cd853f', tertiary: '#deb887' },
    { name: 'Ocean', primary: '#006994', secondary: '#00bcd4', tertiary: '#e0ffff' },
    { name: 'Magma', primary: '#8b0000', secondary: '#ff4500', tertiary: '#ff8c00' },
    { name: 'Forest', primary: '#006400', secondary: '#228b22', tertiary: '#90ee90' },
    { name: 'Steel', primary: '#2f4f4f', secondary: '#778899', tertiary: '#dcdcdc' },
];

const head = HEAD_TYPES[Math.floor(rand() * HEAD_TYPES.length)];
const body = BODY_TYPES[Math.floor(rand() * BODY_TYPES.length)];
const tail = TAIL_TYPES[Math.floor(rand() * TAIL_TYPES.length)];
const palette = PALETTES[Math.floor(rand() * PALETTES.length)];

const identity = {
    role: type === 'warform' ? 'warrior' : 'companion',
    gender,
    head_type: head,
    body_type: body,
    tail_type: tail,
    color_profile: palette
};

console.log('Generated Identity:', JSON.stringify(identity, null, 2));
