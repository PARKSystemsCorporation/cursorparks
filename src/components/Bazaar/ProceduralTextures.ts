import * as THREE from "three";

// --- HELPERS ---
function createCanvas(size: number) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

function getContext(canvas: HTMLCanvasElement) {
    return canvas.getContext("2d")!;
}

// Helper to create a noise pattern
function fillNoise(ctx: CanvasRenderingContext2D, size: number, alpha: number = 0.1) {
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() * 255;
        // Blend random noise with existing pixel
        // We only touch alpha or overlay it? Simple noise overlay:
        // If we want pure noise we modify RGB. If we want overlay we use globalAlpha before drawing.
        // Here we manipulate pixels directly for speed.
        // But direct pixel manipulation is tricky for blending.
        // Let's use fillRect with small random rects for "blocky" noise or just use canvas drawing.
    }
    // Easier: Draw random tiny rectangles
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < size * size / 100; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    ctx.restore();
}

function createTextureFromCanvas(canvas: HTMLCanvasElement) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // texture.minFilter = THREE.LinearMipmapLinearFilter; // Default
    return texture;
}

// --- GENERATORS ---

/**
 * Grimy Concrete Wall
 * Dark grey, panel lines, water stains, rust drips.
 */
export function createConcreteWallTexture() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, size, size);

    // Noise/Grime
    fillNoise(ctx, size, 0.05);

    // Panel lines (every 256px)
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= size; i += 256) {
        // Horizontal
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        // Vertical
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
    }
    ctx.stroke();

    // Water/Rust Stains
    ctx.globalCompositeOperation = "multiply";
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const w = 50 + Math.random() * 100;
        const h = 200 + Math.random() * 400;
        const grd = ctx.createLinearGradient(x, 0, x, h);
        grd.addColorStop(0, "rgba(20, 10, 5, 0.5)"); // Rust top
        grd.addColorStop(1, "rgba(20, 10, 5, 0)");   // Fade out
        ctx.fillStyle = grd;
        ctx.fillRect(x - w / 2, 0, w, h);
    }

    // Random grime patches
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 50 + Math.random() * 100;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "rgba(0,0,0,0.6)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    // Rivets at intersections
    ctx.fillStyle = "#151515";
    for (let i = 0; i <= size; i += 256) {
        for (let j = 0; j <= size; j += 256) {
            if (i > 0 && i < size && j > 0 && j < size) {
                ctx.beginPath();
                ctx.arc(i, j, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    return createTextureFromCanvas(canvas);
}

/**
 * Concrete Normal Map
 * Generates height -> normal map-like appearance (purple/blue).
 * We'll simulate it by drawing the height map in greyscale where white=high, black=low,
 * but wait, Three.js wants an actual normal map (RGB = XYZ vector).
 * Simulating a real normal map on 2D canvas is hard.
 * Trick: We can just use a "bump map" approach but save it as a normal map color? 
 * Or actually, for Procedural simple approach, we can define "High" areas as lighter and convert to Normal,
 * OR we just draw the "Edges" with specific colors.
 * 
 * Easier approach for "Good Texture Pack" without heavy math:
 * Just draw the panels and rivets as a Bump Map (greyscale) and use `bumpMap` property instead of `normalMap`.
 * It's cheaper and easier to generate. The implementation plan said "normal map", but `bumpMap` is valid too.
 * However, let's try to fake a Normal Map for better lighting reaction.
 * 
 * Standard Normal: Flat = (128, 128, 255) -> #8080ff
 */
export function createConcreteWallNormal() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Flat surface
    ctx.fillStyle = "#8080ff";
    ctx.fillRect(0, 0, size, size);

    // Panel grooves (Deep = dark logic? No, Normal map logic: bevels)
    // Simple fake: Draw spacing lines.
    // Actually, let's switch to Bump Map generation if we want easy proceduralism.
    // But let's stick to the plan: Normal Map.
    // We can draw "bevels".
    // Left side of groove: faces left (Red < 128)
    // Right side of groove: faces right (Red > 128)
    // Top side of groove: faces up (Green > 128)
    // Bottom side of groove: faces down (Green < 128)

    const drawGroove = (x: number, y: number, w: number, h: number) => {
        // Vertical groove
        if (h > w) {
            // Left edge faces right (Red > 128) -> #ff80ff
            ctx.fillStyle = "#ff80ff";
            ctx.fillRect(x, y, w / 2, h);
            // Right edge faces left (Red < 128) -> #0080ff
            ctx.fillStyle = "#0080ff";
            ctx.fillRect(x + w / 2, y, w / 2, h);
        } else {
            // Horizontal groove
            // Top edge faces down (Green < 128) -> #8000ff
            ctx.fillStyle = "#8000ff";
            ctx.fillRect(x, y, w, h / 2);
            // Bottom edge faces up (Green > 128) -> #80ffff
            ctx.fillStyle = "#80ffff";
            ctx.fillRect(x, y + h / 2, w, h / 2);
        }
    };

    for (let i = 0; i <= size; i += 256) {
        drawGroove(0, i - 2, size, 4); // Horiz
        drawGroove(i - 2, 0, 4, size); // Vert
    }

    // Noise for surface roughness
    // Speckle with slight variations from #8080ff
    // ctx.globalAlpha = 0.1;
    // fillNoise(ctx, size, 0.05); // This might look too noisy as normal. Skip for now.

    return createTextureFromCanvas(canvas);
}


/**
 * Wet Floor
 * Dark, reflective, puddles (in roughness map?), oil stains.
 * returns Diffuse.
 */
export function createWetFloorTexture() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base asphalt/metal
    ctx.fillStyle = "#111115";
    ctx.fillRect(0, 0, size, size);

    // Noise
    fillNoise(ctx, size, 0.1);

    // Grids/Tiles (smaller)
    ctx.strokeStyle = "#080808"; // Darker gaps
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tileSize = 64;
    for (let i = 0; i <= size; i += tileSize) {
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
    }
    ctx.stroke();

    // Oil Stains (Rainbow or just dark?)
    // Dark patches
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 50 + Math.random() * 150;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "#000");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    return createTextureFromCanvas(canvas);
}

/**
 * Wet Floor Roughness Map
 * Black = Smooth (Wet/Puddle), White = Rough (Dry).
 */
export function createWetFloorRoughness() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base roughness (Semi-rough concrete) -> Grey
    ctx.fillStyle = "#666";
    ctx.fillRect(0, 0, size, size);

    // Puddles -> Black (Smooth)
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        // Irregular blobs would be better, but circles are fast
        const r = 100 + Math.random() * 200;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "#000");      // Wet center
        grd.addColorStop(0.7, "#222");    // Wet edge
        grd.addColorStop(1, "transparent");// Dry
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Noise (grain)
    fillNoise(ctx, size, 0.2);

    return createTextureFromCanvas(canvas);
}

/**
 * Metal Tech Panel
 * Brushed metal look with rivets.
 */
export function createMetalPanelTexture() {
    const size = 512;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base
    ctx.fillStyle = "#4a4a55";
    ctx.fillRect(0, 0, size, size);

    // Brush marks (horizontal lines with low alpha)
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#fff";
    for (let i = 0; i < size; i += 2) {
        if (Math.random() > 0.5) ctx.fillRect(Math.random() * size, i, Math.random() * 100, 1);
    }
    ctx.fillStyle = "#000";
    for (let i = 0; i < size; i += 2) {
        if (Math.random() > 0.5) ctx.fillRect(Math.random() * size, i, Math.random() * 100, 1);
    }
    ctx.globalAlpha = 1.0;

    // Tech lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, size - 20, size - 20);
    ctx.strokeRect(50, 50, size - 100, size - 100);

    // Rivets
    ctx.fillStyle = "#222";
    const rivets = [20, size - 20];
    rivets.forEach(x => {
        rivets.forEach(y => {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    return createTextureFromCanvas(canvas);
}

/**
 * Wood Crate
 */
export function createWoodCrateTexture() {
    const size = 512;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base brown
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, 0, size, size);

    // Planks
    ctx.strokeStyle = "#3e2b22";
    ctx.lineWidth = 4;
    for (let i = 0; i < size; i += size / 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
    }

    // Grain
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#000";
    for (let i = 0; i < size * 2; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 50 + Math.random() * 100;
        ctx.fillRect(x, y, w, 2);
    }
    ctx.globalAlpha = 1.0;

    // Stamp
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-0.2);
    ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
    ctx.lineWidth = 8;
    ctx.strokeRect(-100, -50, 200, 100);
    ctx.font = "bold 60px monospace";
    ctx.fillStyle = "rgba(200,200,200,0.4)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FRAGILE", 0, 0);
    ctx.restore();

    return createTextureFromCanvas(canvas);
}

export function createRustPipeTexture() {
    const size = 512;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base Grey
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 0, size, size);

    // Rust patches
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 20 + Math.random() * 60;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "#8b4513");
        grd.addColorStop(0.7, "#cd853f");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return createTextureFromCanvas(canvas);
}
