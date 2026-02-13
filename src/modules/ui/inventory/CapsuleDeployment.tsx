"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const HAND_OFFSET = new THREE.Vector3(0.15, -0.15, -0.4);

export function CapsuleDeployment() {
  const { dragState, confirmDeploy } = useInventory();
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !dragState) return;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.position.add(HAND_OFFSET.clone().applyQuaternion(camera.quaternion));
  });

  useEffect(() => {
    if (!dragState) return;
    const canvas = gl.domElement;
    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouse, camera);
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(ground, hit)) {
        confirmDeploy({ x: hit.x, y: 0, z: hit.z });
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, [dragState, camera, gl.domElement, confirmDeploy]);

  if (!dragState) return null;

  return (
    <group ref={groupRef}>
      <mesh scale={0.12} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#ff6b1a" emissive="#c0392b" emissiveIntensity={0.3} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}
