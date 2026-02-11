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

// Fixed noise function — uses direct pixel manipulation for proper fine-grain detail
function fillNoise(ctx: CanvasRenderingContext2D, size: number, alpha: number = 0.1) {
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const strength = Math.round(alpha * 255);
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * strength;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        // Alpha unchanged
    }
    ctx.putImageData(imageData, 0, 0);
}

const MAX_ANISOTROPY = 4; // Safe default, works on all GPUs

function createTextureFromCanvas(canvas: HTMLCanvasElement) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = MAX_ANISOTROPY;
    return texture;
}

// --- GENERATORS ---

/**
 * Grimy Concrete Wall — 2048px for HD close-up quality
 * Dark grey, panel lines, water stains, rust drips.
 */
export function createConcreteWallTexture() {
    const size = 2048;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, size, size);

    // Noise/Grime
    fillNoise(ctx, size, 0.05);

    // Panel lines (every 512px at 2048)
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= size; i += 512) {
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
    }
    ctx.stroke();

    // Water/Rust Stains
    ctx.globalCompositeOperation = "multiply";
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const w = 100 + Math.random() * 200;
        const h = 400 + Math.random() * 800;
        const grd = ctx.createLinearGradient(x, 0, x, h);
        grd.addColorStop(0, "rgba(20, 10, 5, 0.5)");
        grd.addColorStop(1, "rgba(20, 10, 5, 0)");
        ctx.fillStyle = grd;
        ctx.fillRect(x - w / 2, 0, w, h);
    }

    // Random grime patches
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 100 + Math.random() * 200;
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
    for (let i = 0; i <= size; i += 512) {
        for (let j = 0; j <= size; j += 512) {
            if (i > 0 && i < size && j > 0 && j < size) {
                ctx.beginPath();
                ctx.arc(i, j, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    return createTextureFromCanvas(canvas);
}

/**
 * Concrete Normal Map — 2048px to match diffuse
 */
export function createConcreteWallNormal() {
    const size = 2048;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Flat surface
    ctx.fillStyle = "#8080ff";
    ctx.fillRect(0, 0, size, size);

    const drawGroove = (x: number, y: number, w: number, h: number) => {
        if (h > w) {
            ctx.fillStyle = "#ff80ff";
            ctx.fillRect(x, y, w / 2, h);
            ctx.fillStyle = "#0080ff";
            ctx.fillRect(x + w / 2, y, w / 2, h);
        } else {
            ctx.fillStyle = "#8000ff";
            ctx.fillRect(x, y, w, h / 2);
            ctx.fillStyle = "#80ffff";
            ctx.fillRect(x, y + h / 2, w, h / 2);
        }
    };

    for (let i = 0; i <= size; i += 512) {
        drawGroove(0, i - 3, size, 6);
        drawGroove(i - 3, 0, 6, size);
    }

    // Add subtle surface variation noise to normal map
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Only add very slight noise to R and G channels (normal X/Y)
        data[i] = Math.max(0, Math.min(255, data[i] + (Math.random() - 0.5) * 6));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + (Math.random() - 0.5) * 6));
    }
    ctx.putImageData(imageData, 0, 0);

    return createTextureFromCanvas(canvas);
}


/**
 * Wet Floor — 2048px for close-up ground detail
 */
export function createWetFloorTexture() {
    const size = 2048;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base asphalt/metal
    ctx.fillStyle = "#111115";
    ctx.fillRect(0, 0, size, size);

    // Noise
    fillNoise(ctx, size, 0.1);

    // Grids/Tiles
    ctx.strokeStyle = "#080808";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tileSize = 128; // Scaled for 2048
    for (let i = 0; i <= size; i += tileSize) {
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
    }
    ctx.stroke();

    // Oil Stains
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 100 + Math.random() * 300;
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
 * Wet Floor Roughness Map — 2048px
 */
export function createWetFloorRoughness() {
    const size = 2048;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base roughness
    ctx.fillStyle = "#666";
    ctx.fillRect(0, 0, size, size);

    // Puddles → Black (Smooth)
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 200 + Math.random() * 400;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "#000");
        grd.addColorStop(0.7, "#222");
        grd.addColorStop(1, "transparent");
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
 * Metal Tech Panel — 1024px (up from 512)
 */
export function createMetalPanelTexture() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base
    ctx.fillStyle = "#4a4a55";
    ctx.fillRect(0, 0, size, size);

    // Brush marks (horizontal lines with low alpha)
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#fff";
    for (let i = 0; i < size; i += 2) {
        if (Math.random() > 0.5) ctx.fillRect(Math.random() * size, i, Math.random() * 200, 1);
    }
    ctx.fillStyle = "#000";
    for (let i = 0; i < size; i += 2) {
        if (Math.random() > 0.5) ctx.fillRect(Math.random() * size, i, Math.random() * 200, 1);
    }
    ctx.globalAlpha = 1.0;

    // Tech lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, size - 40, size - 40);
    ctx.strokeRect(100, 100, size - 200, size - 200);

    // Rivets
    ctx.fillStyle = "#222";
    const rivets = [40, size - 40];
    rivets.forEach(x => {
        rivets.forEach(y => {
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // Fine grain noise
    fillNoise(ctx, size, 0.03);

    return createTextureFromCanvas(canvas);
}

/**
 * Wood Crate — 1024px (up from 512)
 */
export function createWoodCrateTexture() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base brown
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, 0, size, size);

    // Planks
    ctx.strokeStyle = "#3e2b22";
    ctx.lineWidth = 6;
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
        const w = 50 + Math.random() * 150;
        ctx.fillRect(x, y, w, 2);
    }
    ctx.globalAlpha = 1.0;

    // Stamp
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-0.2);
    ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
    ctx.lineWidth = 8;
    ctx.strokeRect(-120, -60, 240, 120);
    ctx.font = "bold 72px monospace";
    ctx.fillStyle = "rgba(200,200,200,0.4)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FRAGILE", 0, 0);
    ctx.restore();

    // Fine grain noise
    fillNoise(ctx, size, 0.04);

    return createTextureFromCanvas(canvas);
}

export function createRustPipeTexture() {
    const size = 1024;
    const canvas = createCanvas(size);
    const ctx = getContext(canvas);

    // Base Grey
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 0, size, size);

    // Rust patches
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 40 + Math.random() * 120;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "#8b4513");
        grd.addColorStop(0.7, "#cd853f");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fine grain noise
    fillNoise(ctx, size, 0.05);

    return createTextureFromCanvas(canvas);
}
