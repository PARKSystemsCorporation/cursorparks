"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { BOND_RELEASE_EVENT } from "@/src/modules/exokin/ExokinDevice";

const HAND_OFFSET = new THREE.Vector3(0.15, -0.15, -0.4);

function raycastGround(camera: THREE.Camera, gl: THREE.WebGLRenderer, clientX: number, clientY: number): { x: number; y: number; z: number } | null {
  const canvas = gl.domElement;
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(x, y);
  raycaster.setFromCamera(mouse, camera);
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(ground, hit)) {
    return { x: hit.x, y: 0, z: hit.z };
  }
  return null;
}

/** Shows 3D card during deploy. Only active when drag is from EXOKIN device (bond); ground hit on bond release. */
export function WalletCardDeployment() {
  const { dragState, confirmDeploy, cancelDrag } = useInventory();
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !dragState) return;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.position.add(HAND_OFFSET.clone().applyQuaternion(camera.quaternion));
  });

  useEffect(() => {
    if (!dragState?.fromBond) return;
    const handler = (e: CustomEvent<{ clientX: number; clientY: number }>) => {
      const { clientX, clientY } = e.detail || {};
      const rect = gl.domElement.getBoundingClientRect();
      const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      if (inside) {
        const position = raycastGround(camera, gl, clientX, clientY);
        if (position) confirmDeploy(position);
        else cancelDrag();
      } else {
        cancelDrag();
      }
    };
    window.addEventListener(BOND_RELEASE_EVENT, handler as EventListener);
    return () => window.removeEventListener(BOND_RELEASE_EVENT, handler as EventListener);
  }, [dragState?.fromBond, camera, gl, confirmDeploy, cancelDrag]);

  useEffect(() => {
    if (!dragState || dragState.fromBond) return;
    const canvas = gl.domElement;
    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const position = raycastGround(camera, gl, e.clientX, e.clientY);
      if (position) confirmDeploy(position);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, [dragState, dragState?.fromBond, camera, gl, confirmDeploy]);

  if (!dragState) return null;

  return (
    <group ref={groupRef}>
      <mesh scale={0.12} castShadow rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 0.5, 0.32]} />
        <meshStandardMaterial
          color="#1c1a18"
          metalness={0.7}
          roughness={0.4}
          emissive="#0a0806"
        />
      </mesh>
    </group>
  );
}
