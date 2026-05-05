import { useCallback, useEffect, useRef, useState, RefObject } from 'react';

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const STEP = 0.15;
const WHEEL_INTENSITY = 0.0015;

interface State {
  scale: number;
  x: number;
  y: number;
}

interface PointerInfo {
  x: number;
  y: number;
}

export function usePanZoom(containerRef: RefObject<HTMLElement>) {
  const [scale, setScale] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stateRef = useRef<State>({ scale: 1, x: 0, y: 0 });
  useEffect(() => { stateRef.current = { scale, x, y }; }, [scale, x, y]);

  const pointersRef = useRef<Map<number, PointerInfo>>(new Map());
  const dragRef = useRef<{ id: number; startX: number; startY: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ initialDist: number; initialScale: number; initialX: number; initialY: number; cx: number; cy: number } | null>(null);

  // Optional content bounds (set by consumer) — when present, pan is clamped so the content is
  // always either centered (when smaller than container) or fully covers it (when larger).
  const contentBoundsRef = useRef<{ contentW: number; contentH: number } | null>(null);
  const setContentBounds = useCallback((b: { contentW: number; contentH: number } | null) => {
    contentBoundsRef.current = b;
  }, []);

  const clamp = (v: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, v));

  const constrain = useCallback((s: number, nx: number, ny: number) => {
    const b = contentBoundsRef.current;
    const el = containerRef.current;
    if (!b || !el) return { scale: s, x: nx, y: ny };
    const rect = el.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const svgW = b.contentW * s;
    const svgH = b.contentH * s;
    const x =
      svgW <= cw
        ? (cw - svgW) / 2
        : Math.max(cw - svgW, Math.min(0, nx));
    const y =
      svgH <= ch
        ? (ch - svgH) / 2
        : Math.max(ch - svgH, Math.min(0, ny));
    return { scale: s, x, y };
  }, [containerRef]);

  const zoomAround = useCallback((newScale: number, clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const { scale: s, x: tx, y: ty } = stateRef.current;
    const next = clamp(newScale);
    const ratio = next / s;
    const proposedX = cx - (cx - tx) * ratio;
    const proposedY = cy - (cy - ty) * ratio;
    const c = constrain(next, proposedX, proposedY);
    setScale(c.scale);
    setX(c.x);
    setY(c.y);
  }, [containerRef, constrain]);

  const zoomIn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAround(stateRef.current.scale + STEP, r.left + r.width / 2, r.top + r.height / 2);
  }, [zoomAround, containerRef]);

  const zoomOut = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAround(stateRef.current.scale - STEP, r.left + r.width / 2, r.top + r.height / 2);
  }, [zoomAround, containerRef]);

  const reset = useCallback(() => {
    const c = constrain(1, 0, 0);
    setScale(c.scale);
    setX(c.x);
    setY(c.y);
  }, [constrain]);

  const setView = useCallback((next: { scale?: number; x?: number; y?: number }) => {
    const cur = stateRef.current;
    const s = next.scale !== undefined ? clamp(next.scale) : cur.scale;
    const nx = next.x !== undefined ? next.x : cur.x;
    const ny = next.y !== undefined ? next.y : cur.y;
    const c = constrain(s, nx, ny);
    setScale(c.scale);
    setX(c.x);
    setY(c.y);
  }, [constrain]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * WHEEL_INTENSITY);
      zoomAround(stateRef.current.scale * factor, e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 1) {
        const { x: tx, y: ty } = stateRef.current;
        dragRef.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, ox: tx, oy: ty };
        setDragging(true);
      } else if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        pinchRef.current = {
          initialDist: Math.hypot(dx, dy) || 1,
          initialScale: stateRef.current.scale,
          initialX: stateRef.current.x,
          initialY: stateRef.current.y,
          cx: (pts[0].x + pts[1].x) / 2,
          cy: (pts[0].y + pts[1].y) / 2,
        };
        dragRef.current = null;
        setDragging(false);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 2 && pinchRef.current) {
        const pts = Array.from(pointersRef.current.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const dist = Math.hypot(dx, dy);
        const newScale = clamp(pinchRef.current.initialScale * dist / pinchRef.current.initialDist);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        zoomAround(newScale, cx, cy);
      } else if (dragRef.current && dragRef.current.id === e.pointerId) {
        const proposedX = dragRef.current.ox + (e.clientX - dragRef.current.startX);
        const proposedY = dragRef.current.oy + (e.clientY - dragRef.current.startY);
        const c = constrain(stateRef.current.scale, proposedX, proposedY);
        setX(c.x);
        setY(c.y);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 0) {
        dragRef.current = null;
        setDragging(false);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
    };
  }, [containerRef, zoomAround, constrain]);

  return {
    scale,
    x,
    y,
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    translate: `translate(${x}px, ${y}px)`,
    zoomIn,
    zoomOut,
    reset,
    setView,
    setContentBounds,
    dragging,
  };
}
