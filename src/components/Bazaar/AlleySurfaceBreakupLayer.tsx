import { useMemo } from 'react';
import * as THREE from 'three';

// Procedural generation for decal textures
function createNoiseDecal(color: string, alphaMax: number = 0.5) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clear
    ctx.clearRect(0, 0, 512, 512);

    // Radial gradient fade
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Noise multiply
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If alpha > 0
            const noise = Math.random();
            data[i + 3] = data[i + 3] * noise * alphaMax; // Scale alpha by noise
        }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export function AlleySurfaceBreakupLayer() {
    const decals = useMemo(() => {
        const grime = createNoiseDecal('#1a1a10', 0.8);
        const stain = createNoiseDecal('#050505', 0.9);
        return { grime, stain };
    }, []);

    const ALLEY_WIDTH = 4;
    const ALLEY_LENGTH = 30;

    // Generate random positions for decals
    const floorDecals = useMemo(() => {
        return Array.from({ length: 15 }).map(() => ({
            position: [
                (Math.random() - 0.5) * (ALLEY_WIDTH - 0.5),
                0.01, // Slightly above ground
                -(Math.random() * (ALLEY_LENGTH - 2))
            ] as [number, number, number],
            scale: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI,
            texture: Math.random() > 0.6 ? decals.stain : decals.grime
        }));
    }, [decals]);

    return (
        <group>
            {floorDecals.map((d, i) => (
                <mesh
                    key={i}
                    position={d.position}
                    rotation={[-Math.PI / 2, 0, d.rotation]}
                    scale={d.scale}
                >
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        map={d.texture}
                        transparent
                        opacity={0.7}
                        depthWrite={false}
                        blending={THREE.MultiplyBlending}
                        premultipliedAlpha={true}
                    />
                </mesh>
            ))}

            {/* Edge Grime - Left Wall Base */}
            <mesh position={[-ALLEY_WIDTH / 2 + 0.2, 0.02, -ALLEY_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, ALLEY_LENGTH]} />
                <meshBasicMaterial color="#000" transparent opacity={0.5} depthWrite={false} blending={THREE.MultiplyBlending} premultipliedAlpha={true}>

                </meshBasicMaterial>
            </mesh>
            {/* Edge Grime - Right Wall Base */}
            <mesh position={[ALLEY_WIDTH / 2 - 0.2, 0.02, -ALLEY_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, ALLEY_LENGTH]} />
                <meshBasicMaterial color="#000" transparent opacity={0.5} depthWrite={false} blending={THREE.MultiplyBlending} premultipliedAlpha={true} />
            </mesh>
        </group>
    );
}
