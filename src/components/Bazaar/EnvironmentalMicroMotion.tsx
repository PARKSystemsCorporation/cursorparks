import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function EnvironmentalMicroMotion() {
    const groupRef = useRef<THREE.Group>(null);
    const cablesRef = useRef<THREE.Mesh[]>([]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Idle sway for all registered hanging objects
        cablesRef.current.forEach((mesh, i) => {
            if (!mesh) return;
            const seed = i * 1.5;
            // Combined sine waves for non-repeating feel
            const sway = Math.sin(time * 0.5 + seed) * 0.02 + Math.cos(time * 0.3 + seed) * 0.01;
            mesh.rotation.z = sway;
        });
    });

    return (
        <group ref={groupRef}>
            {/* Hanging Cables - Simple catenary curves simulated with scaling/rotation */}
            {Array.from({ length: 5 }).map((_, i) => (
                <mesh
                    key={i}
                    ref={(el) => { if (el) cablesRef.current[i] = el; }}
                    position={[0, 4.5, -5 - (i * 6)]}
                    rotation={[0, 0, (Math.random() - 0.5) * 0.1]}
                >
                    {/* Catenary curve geo approximated by a bent tube or just a thin cylinder slightly scaled */}
                    <catmullRomCurve3
                        args={[[
                            new THREE.Vector3(-1.8, 0, 0),
                            new THREE.Vector3(-0.5, -0.2, 0),
                            new THREE.Vector3(0.5, -0.2, 0),
                            new THREE.Vector3(1.8, 0, 0)
                        ]]}
                    />
                    {/* Fallback to simple geometry since R3F helpers used differently. 
                        Let's use a TubeGeometry or just visual lines. 
                        For "Lightweight" + "Shadows", a thin cylinder is best.
                     */}
                    <torusGeometry args={[2.5, 0.01, 8, 30, Math.PI / 2.5]} />
                    <meshStandardMaterial color="#111" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}
