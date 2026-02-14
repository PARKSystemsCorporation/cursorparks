"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { EYE_HEIGHT, clampPosition } from "./firstPersonBounds";
import { useCameraOverride } from "./CameraOverrideContext";
import { cameraPos } from "@/src/modules/ui/CoordTracker";
import { useMobileControls } from "./MobileControlsContext";

const MOUSE_SENSITIVITY = 0.002;
const TOUCH_LOOK_SPEED = 2.4;

const GRAVITY = 18.0;
const JUMP_FORCE = 6.0;   // approx 1 unit high
const FLIP_FORCE = 7.0;   // slightly higher for flair

const BASE_SPEED = 4;
const RUN_SPEED_MULT = 3;
const SPRINT_SPEED_MULT = 6;
const DOUBLE_TAP_WINDOW = 300; // ms

export function FirstPersonController() {
  const { camera, gl } = useThree();
  const { active: cameraOverrideActive } = useCameraOverride();
  const { axesRef, reset } = useMobileControls();
  const [locked, setLocked] = useState(false);
  const isTouchControlRef = useRef(false);

  const rotation = useRef({ yaw: Math.PI, pitch: 0 });
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // Physics & State
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const jumpCount = useRef(0);
  const isGrounded = useRef(true);
  const lastShiftTime = useRef(0);
  const currentSpeed = useRef(BASE_SPEED);
  const isFlipping = useRef(false);

  // Vectors for calculation
  const moveVec = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  const requestLock = useCallback(() => {
    gl.domElement.requestPointerLock?.();
  }, [gl.domElement]);

  useEffect(() => {
    const canvas = gl.domElement;
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const syncTouchMode = () => {
      isTouchControlRef.current = coarsePointer.matches || navigator.maxTouchPoints > 0;
      if (!isTouchControlRef.current) reset();
    };
    syncTouchMode();

    const requestLock = () => {
      gl.domElement.requestPointerLock?.();
    };

    const handleClick = () => {
      if (document.body.classList.contains("parks-ui-open")) return;
      if (isTouchControlRef.current) return;
      if (!document.pointerLockElement) requestLock();
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvas;
      setLocked(isLocked);
    };

    // Flip Animation
    const performFrontflip = () => {
      if (isFlipping.current) return;
      isFlipping.current = true;

      const startPitch = rotation.current.pitch;
      const targetPitch = startPitch - (Math.PI * 2);

      gsap.to(rotation.current, {
        pitch: targetPitch,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          rotation.current.pitch = 0;
          isFlipping.current = false;
        }
      });
    };

    // Jump Logic
    const handleJump = () => {
      if (isGrounded.current) {
        // 1st Jump
        velocity.current.y = JUMP_FORCE;
        isGrounded.current = false;
        jumpCount.current = 1;
      } else {
        // Air Jumps
        if (jumpCount.current === 1) {
          // 2nd Jump
          velocity.current.y = JUMP_FORCE;
          jumpCount.current = 2;
        } else if (jumpCount.current === 2) {
          // 3rd Jump (Frontflip)
          velocity.current.y = FLIP_FORCE;
          jumpCount.current = 3;
          performFrontflip();
        }
      }
    };

    // Speed Logic
    const handleShiftDown = () => {
      const now = Date.now();
      const timeSinceLast = now - lastShiftTime.current;

      if (timeSinceLast < DOUBLE_TAP_WINDOW) {
        // Double Tap -> 6x
        currentSpeed.current = BASE_SPEED * SPRINT_SPEED_MULT;
      } else {
        // Single Hold -> 3x
        currentSpeed.current = BASE_SPEED * RUN_SPEED_MULT;
      }
      lastShiftTime.current = now;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      switch (k) {
        case "w": keys.current.w = true; break;
        case "a": keys.current.a = true; break;
        case "s": keys.current.s = true; break;
        case "d": keys.current.d = true; break;
        case " ": // Space - Jump
          if (document.pointerLockElement === canvas) {
            handleJump();
          }
          break;
        case "shift":
          handleShiftDown();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      switch (k) {
        case "w": keys.current.w = false; break;
        case "a": keys.current.a = false; break;
        case "s": keys.current.s = false; break;
        case "d": keys.current.d = false; break;
        case "shift":
          // Reset to base speed on release
          currentSpeed.current = BASE_SPEED;
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      if (isFlipping.current) return; // Disable look during flip
      rotation.current.yaw -= e.movementX * MOUSE_SENSITIVITY;
      rotation.current.pitch -= e.movementY * MOUSE_SENSITIVITY;
      rotation.current.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotation.current.pitch));
    };

    canvas.addEventListener("click", handleClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    coarsePointer.addEventListener("change", syncTouchMode);
    window.addEventListener("resize", syncTouchMode);
    window.addEventListener("orientationchange", syncTouchMode);

    return () => {
      canvas.removeEventListener("click", handleClick);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      coarsePointer.removeEventListener("change", syncTouchMode);
      window.removeEventListener("resize", syncTouchMode);
      window.removeEventListener("orientationchange", syncTouchMode);
    };
  }, [gl.domElement, reset]);

  useFrame((_, delta) => {
    if (cameraOverrideActive) return;

    // Apply Physics
    if (!isGrounded.current) {
      velocity.current.y -= GRAVITY * delta;
    }

    // Apply Velocity to Camera
    camera.position.y += velocity.current.y * delta;

    // Ground Collision
    if (camera.position.y <= EYE_HEIGHT) {
      camera.position.y = EYE_HEIGHT;
      velocity.current.y = 0;
      isGrounded.current = true;
      jumpCount.current = 0;
      // Note: jumpCount resets on landing, allowing next cycle
    } else {
      isGrounded.current = false;
    }

    const pointerLocked = document.pointerLockElement === gl.domElement;
    const mobileAxes = axesRef.current;
    const mobileActive = isTouchControlRef.current && (mobileAxes.moving || mobileAxes.looking);

    if (!pointerLocked && !mobileActive && isGrounded.current) {
      // Friction / Stop if grounded and no input
      return;
    }
    // We continue if air-borne so momentum/gravity works even without input (though we lack air resistance here)

    if (isTouchControlRef.current) {
      rotation.current.yaw -= mobileAxes.lookX * TOUCH_LOOK_SPEED * delta;
      if (!isFlipping.current) {
        rotation.current.pitch += mobileAxes.lookY * TOUCH_LOOK_SPEED * delta;
        rotation.current.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotation.current.pitch));
      }
    }

    const yaw = rotation.current.yaw;
    forward.current.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.current.set(Math.cos(yaw), 0, -Math.sin(yaw));

    moveVec.current.set(0, 0, 0);
    if (keys.current.w) moveVec.current.add(forward.current);
    if (keys.current.s) moveVec.current.sub(forward.current);
    if (keys.current.d) moveVec.current.add(right.current);
    if (keys.current.a) moveVec.current.sub(right.current);

    if (isTouchControlRef.current) {
      moveVec.current.addScaledVector(forward.current, mobileAxes.moveY);
      moveVec.current.addScaledVector(right.current, mobileAxes.moveX);
    }

    if (moveVec.current.lengthSq() > 0) {
      moveVec.current.normalize().multiplyScalar(currentSpeed.current * delta);
      const x = camera.position.x + moveVec.current.x;
      const z = camera.position.z + moveVec.current.z;
      const c = clampPosition(x, z);
      camera.position.x = c.x;
      camera.position.z = c.z;
    }

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotation.current.pitch);
    camera.quaternion.copy(qYaw.multiply(qPitch));

    // Write to shared ref for CoordTracker
    cameraPos.x = camera.position.x;
    cameraPos.y = camera.position.y;
    cameraPos.z = camera.position.z;
  });

  if (!locked) {
    return (
      <group position={[0, 0, 0]}>
        <mesh visible={false} position={[0, 0, 0]} />
      </group>
    );
  }
  return null;
}
