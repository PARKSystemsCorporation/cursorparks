"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useMobileControls } from "@/src/modules/world/MobileControlsContext";

const STICK_RADIUS = 44;

type StickSide = "move" | "look";

function clampAxis(value: number) {
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
}

export function MobileDualStickOverlay() {
  const { setMove, setLook, reset } = useMobileControls();
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  const moveCenterRef = useRef({ x: 0, y: 0 });
  const lookCenterRef = useRef({ x: 0, y: 0 });
  const movePointerIdRef = useRef<number | null>(null);
  const lookPointerIdRef = useRef<number | null>(null);
  const [moveThumb, setMoveThumb] = useState({ x: 0, y: 0 });
  const [lookThumb, setLookThumb] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => {
      const coarse = media.matches || navigator.maxTouchPoints > 0;
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobileLandscape(coarse && landscape);
      if (!(coarse && landscape)) {
        movePointerIdRef.current = null;
        lookPointerIdRef.current = null;
        setMoveThumb({ x: 0, y: 0 });
        setLookThumb({ x: 0, y: 0 });
        reset();
      }
    };

    sync();
    media.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [reset]);

  const onDown = (side: StickSide, e: PointerEvent<HTMLDivElement>) => {
    if (!isMobileLandscape || e.pointerType === "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (side === "move") {
      moveCenterRef.current = { x: cx, y: cy };
      movePointerIdRef.current = e.pointerId;
    } else {
      lookCenterRef.current = { x: cx, y: cy };
      lookPointerIdRef.current = e.pointerId;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (side: StickSide, e: PointerEvent<HTMLDivElement>) => {
    if (!isMobileLandscape || e.pointerType === "mouse") return;
    const isMoveStick = side === "move";
    const pointerId = isMoveStick ? movePointerIdRef.current : lookPointerIdRef.current;
    if (pointerId !== e.pointerId) return;

    const center = isMoveStick ? moveCenterRef.current : lookCenterRef.current;
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    const len = Math.hypot(dx, dy);
    const scale = len > STICK_RADIUS ? STICK_RADIUS / len : 1;
    const nx = dx * scale;
    const ny = dy * scale;

    const axisX = clampAxis(nx / STICK_RADIUS);
    const axisY = clampAxis(-ny / STICK_RADIUS);

    if (isMoveStick) {
      setMove(axisX, axisY, true);
      setMoveThumb({ x: nx, y: ny });
    } else {
      setLook(axisX, axisY, true);
      setLookThumb({ x: nx, y: ny });
    }
  };

  const onUp = (side: StickSide, e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    const isMoveStick = side === "move";
    if (isMoveStick && movePointerIdRef.current !== e.pointerId) return;
    if (!isMoveStick && lookPointerIdRef.current !== e.pointerId) return;

    if (isMoveStick) {
      movePointerIdRef.current = null;
      setMove(0, 0, false);
      setMoveThumb({ x: 0, y: 0 });
    } else {
      lookPointerIdRef.current = null;
      setLook(0, 0, false);
      setLookThumb({ x: 0, y: 0 });
    }
  };

  const quickHint = useMemo(() => "Left stick move  Right stick view", []);
  if (!isMobileLandscape) return null;

  return (
    <div className="mobile-stick-overlay" aria-hidden>
      <div className="mobile-stick-hint">{quickHint}</div>
      <div
        className="mobile-stick-pad mobile-stick-pad-left"
        onPointerDown={(e) => onDown("move", e)}
        onPointerMove={(e) => onMove("move", e)}
        onPointerUp={(e) => onUp("move", e)}
        onPointerCancel={(e) => onUp("move", e)}
      >
        <div className="mobile-stick-thumb" style={{ transform: `translate(${moveThumb.x}px, ${moveThumb.y}px)` }} />
      </div>
      <div
        className="mobile-stick-pad mobile-stick-pad-right"
        onPointerDown={(e) => onDown("look", e)}
        onPointerMove={(e) => onMove("look", e)}
        onPointerUp={(e) => onUp("look", e)}
        onPointerCancel={(e) => onUp("look", e)}
      >
        <div className="mobile-stick-thumb" style={{ transform: `translate(${lookThumb.x}px, ${lookThumb.y}px)` }} />
      </div>
    </div>
  );
}
