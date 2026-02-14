"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { EYE_HEIGHT, clampPosition } from "./firstPersonBounds";
import { useCameraOverride } from "./CameraOverrideContext";
import { cameraPos } from "@/src/modules/ui/CoordTracker";

const MOUSE_SENSITIVITY = 0.002;
const MOVE_SPEED = 4;

export function FirstPersonController() {
  const { camera, gl } = useThree();
  const { active: cameraOverrideActive } = useCameraOverride();
  const [locked, setLocked] = useState(false);
  // Assume we might have a global "UI Active" state context later.
  // For now, let's rely on pointerLockElement check and allow external lock prevention.
  // If the user clicks on a UI element (like FirstBondPanel), pointer lock shouldn't engage if event is stopped?
  // But FPC listens to canvas click.
  // We need a way to say "Don't Lock".
  // Let's check a data attribute on the body or a global class?
  // Or simply: check if the click target is the canvas.
  const rotation = useRef({ yaw: Math.PI, pitch: 0 });
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const moveVec = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  const requestLock = useCallback(() => {
    gl.domElement.requestPointerLock?.();
  }, [gl.domElement]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleClick = () => {
      // Only lock if clicking directly on the canvas or safe area, not if clicking UI.
      // But the event listener is on `canvas` (gl.domElement).
      // If UI is *over* canvas, clicks on UI won't bubble to canvas if they stop propagation.
      // However, if FirstBondPanel is a sibling of Canvas (which it is), clicks on Panel don't hit Canvas.
      // So this might already be fine IF the panel handles clicks.
      // User reported "need cursor ability". This implies FPC is locking when it shouldn't, or they can't get cursor back.
      // If locked, press ESC to unlock.
      // If Panel is open, we want to PREVENT locking even if they mistarget.

      // Let's check for a global flag or class "parks-ui-open".
      if (document.body.classList.contains("parks-ui-open")) return;

      if (!document.pointerLockElement) requestLock();
    };
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvas;
      setLocked(isLocked);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w": keys.current.w = true; break;
        case "a": keys.current.a = true; break;
        case "s": keys.current.s = true; break;
        case "d": keys.current.d = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w": keys.current.w = false; break;
        case "a": keys.current.a = false; break;
        case "s": keys.current.s = false; break;
        case "d": keys.current.d = false; break;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      rotation.current.yaw -= e.movementX * MOUSE_SENSITIVITY;
      rotation.current.pitch -= e.movementY * MOUSE_SENSITIVITY;
      rotation.current.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotation.current.pitch));
    };

    canvas.addEventListener("click", handleClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("click", handleClick);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gl.domElement, requestLock]);

  useFrame((_, delta) => {
    if (cameraOverrideActive) return;
    camera.position.y = EYE_HEIGHT;

    if (document.pointerLockElement !== gl.domElement) return;

    const yaw = rotation.current.yaw;
    forward.current.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.current.set(Math.cos(yaw), 0, -Math.sin(yaw));

    moveVec.current.set(0, 0, 0);
    if (keys.current.w) moveVec.current.add(forward.current);
    if (keys.current.s) moveVec.current.sub(forward.current);
    if (keys.current.d) moveVec.current.add(right.current);
    if (keys.current.a) moveVec.current.sub(right.current);

    if (moveVec.current.lengthSq() > 0) {
      moveVec.current.normalize().multiplyScalar(MOVE_SPEED * delta);
      const x = camera.position.x + moveVec.current.x;
      const z = camera.position.z + moveVec.current.z;
      const c = clampPosition(x, z);
      camera.position.x = c.x;
      camera.position.z = c.z;
    }

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotation.current.pitch);
    camera.quaternion.copy(qYaw.multiply(qPitch));

    // Write to shared ref for CoordTracker (no event, no alloc)
    cameraPos.x = camera.position.x;
    cameraPos.y = camera.position.y;
    cameraPos.z = camera.position.z;
  });

  if (!locked) {
    return (
      <group position={[0, 0, 0]}>
        <mesh visible={false} position={[0, 0, 0]} />
        {/* Invisible fullscreen overlay for click-to-lock would be HTML; we use canvas click above. */}
      </group>
    );
  }
  return null;
}
