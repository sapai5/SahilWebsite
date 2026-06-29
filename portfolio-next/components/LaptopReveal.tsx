"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const LaptopModel = dynamic(() => import("./LaptopModel"), { ssr: false });

/** The laptop lives in a fixed, full-screen layer behind the page content.
 *  At progress 0 it fills the viewport (a big, blurred background laptop);
 *  as progress → 1 it shrinks and moves to overlay `targetRef` (the box slot),
 *  sharpening as it lands, then tracks the box as you scroll.
 *
 *  Progress is derived from the target's live bounding rect every frame (NOT
 *  from a separate framer scroll value). Deriving both the progress AND the
 *  target position from the same rect in the same frame keeps them perfectly
 *  consistent, which removes the rubber-banding seen on fast scrolls (where a
 *  frame-stale progress disagreed with a fresh rect). */
export default function LaptopReveal({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const wrap = wrapRef.current;
      const target = targetRef.current;
      if (wrap && target) {
        const W = window.innerWidth || 1;
        const H = window.innerHeight || 1;
        const r = target.getBoundingClientRect();

        // Reproduce framer's offset ["start end", "center 0.6"] from the rect:
        //   p = 0 when the box top sits at the viewport bottom (r.top === H)
        //   p = 1 when the box centre sits at 0.6 of the viewport height
        const denom = 0.4 * H + r.height / 2 || 1;
        const p = Math.min(1, Math.max(0, (H - r.top) / denom));
        const ease = p * p * (3 - 2 * p);

        const END_SCALE_MULT = 2.4;
        const END_SHIFT_X = 0.16; // fraction of viewport width, to the right
        const END_SHIFT_Y = 0.05; // fraction of viewport height, downward
        const scaleTarget = (r.width / W) * END_SCALE_MULT;
        const dxTarget = r.left + r.width / 2 - W / 2 + END_SHIFT_X * W;
        const dyTarget = r.top + r.height / 2 - H / 2 + END_SHIFT_Y * H;
        const scale = 1 + (scaleTarget - 1) * ease;
        wrap.style.transform = `translate(${dxTarget * ease}px, ${dyTarget * ease}px) scale(${scale})`;
        wrap.style.filter = `blur(${(1 - ease) * 9}px)`;
        wrap.style.opacity = String(0.45 + 0.55 * ease);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [targetRef]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="fixed inset-0 z-[5] pointer-events-none"
      style={{ transformOrigin: "center center", willChange: "transform, filter, opacity" }}
    >
      <LaptopModel />
    </div>
  );
}
