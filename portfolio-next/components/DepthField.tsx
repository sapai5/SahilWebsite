"use client";

import { useEffect, useRef } from "react";

/* Soft blurred colour orbs at different "depths". They drift with the mouse at
   different rates (near layers move more than far ones) → real parallax depth,
   which the liquid glass then refracts. */
const ORBS = [
  { color: "rgba(99, 102, 241, 0.50)", size: "46vw", top: "2%", left: "6%", depth: 70, delay: "0s" },
  { color: "rgba(56, 189, 248, 0.44)", size: "38vw", top: "-6%", left: "64%", depth: 44, delay: "-4s" },
  { color: "rgba(168, 85, 247, 0.42)", size: "50vw", top: "55%", left: "62%", depth: 100, delay: "-8s" },
  { color: "rgba(45, 212, 191, 0.40)", size: "44vw", top: "62%", left: "2%", depth: 60, delay: "-12s" },
  { color: "rgba(251, 191, 36, 0.30)", size: "32vw", top: "32%", left: "38%", depth: 32, delay: "-6s" },
];

export default function DepthField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const orbs = Array.from(el.children) as HTMLElement[];
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      for (const o of orbs) {
        const d = parseFloat(o.dataset.depth || "0");
        o.style.transform = `translate3d(${(-cx * d).toFixed(1)}px, ${(-cy * d).toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {ORBS.map((o, i) => (
        <div
          key={i}
          data-depth={o.depth}
          className="lg-orb"
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            animationDelay: o.delay,
          }}
        />
      ))}
    </div>
  );
}
