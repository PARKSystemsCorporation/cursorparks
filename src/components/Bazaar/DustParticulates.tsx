import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DustParticulates({ count = 100, area = [10, 8, 20] }: { count?: number, area?: [number, number, number] }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Generate initial random positions and velocities
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * area[0],
                y: Math.random() * area[1],
                z: (Math.random() - 0.5) * area[2] - 5, // Center around the market path
                vx: (Math.random() - 0.5) * 0.002,
                vy: (Math.random() - 0.5) * 0.002,
                vz: (Math.random() - 0.5) * 0.002,
                scale: Math.random() * 0.03 + 0.01,
                offset: Math.random() * 100
            });
        }
        return temp;
    }, [count, area]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const t = clock.getElapsedTime();

        particles.forEach((p, i) => {
            // Float motion
            const mx = p.x + Math.sin(t * 0.2 + p.offset) * 0.5;
            const my = p.y + Math.cos(t * 0.15 + p.offset) * 0.2;
            const mz = p.z + Math.sin(t * 0.1 + p.offset) * 0.5;

            dummy.position.set(mx, my, mz);
            dummy.scale.setScalar(p.scale);
            dummy.rotation.set(t * 0.1, t * 0.2, t * 0.3);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
            <dodecahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial
                color="#eacca7"
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    );
}
