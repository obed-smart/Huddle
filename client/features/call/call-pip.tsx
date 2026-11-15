"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

const W = 112; // w-28
const H = 160; // h-40
const MARGIN = 16;
const TOP = 112; // clear of the header
const BOTTOM = 136; // clear of the controls

/** The small self-view in the corner of a video call. You can drag it anywhere
    (it stays clear of the header and controls), and a tap swaps it with the main
    view. Dragging and tapping are the same gesture told apart by how far it
    moved, so a drag never counts as a tap. */
export function CallPip({ onTap, children }: { onTap: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef({ on: false, moved: false, dx: 0, dy: 0 });

  function clamp(x: number, y: number) {
    const maxX = window.innerWidth - W - MARGIN;
    const maxY = window.innerHeight - H - BOTTOM;
    return { x: Math.max(MARGIN, Math.min(x, maxX)), y: Math.max(TOP, Math.min(y, maxY)) };
  }

  function onDown(e: PointerEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { on: true, moved: false, dx: e.clientX - r.left, dy: e.clientY - r.top };
    ref.current?.setPointerCapture(e.pointerId);
  }

  function onMove(e: PointerEvent) {
    if (!drag.current.on) return;
    drag.current.moved = true;
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  }

  function onUp() {
    if (drag.current.on && !drag.current.moved) onTap();
    drag.current.on = false;
  }

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      className={`absolute z-20 h-40 w-28 cursor-grab touch-none overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-xl active:cursor-grabbing ${pos ? "" : "right-4 top-40"}`}
    >
      {children}
    </div>
  );
}
