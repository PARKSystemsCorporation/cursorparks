import { useMemo } from 'react';
import * as THREE from 'three';

function createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

export function ContactShadowSystem() {
    const shadowTex = useMemo(() => createShadowTexture(), []);

    // Placeholder for where props will be. 
    // In a real system, props would register themselves or we'd map this to prop positions.
    // For now, hardcoded to match where we WILL put props.
    const shadows = [
        { pos: [-1.2, 0.015, -4], size: 1.5 },
        { pos: [1.2, 0.015, -8], size: 1.8 },
        { pos: [-1.0, 0.015, -12], size: 1.2 },
        { pos: [1.3, 0.015, -18], size: 1.6 },
    ];

    return (
        <group>
            {shadows.map((s, i) => (
                <mesh
                    key={i}
                    position={s.pos as [number, number, number]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={s.size}
                >
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        map={shadowTex}
                        transparent
                        opacity={0.9}
                        depthWrite={false}
                        blending={THREE.MultiplyBlending}
                        toneMapped={false}
                        premultipliedAlpha={true}
                    />
                </mesh>
            ))}
        </group>
    );
}
