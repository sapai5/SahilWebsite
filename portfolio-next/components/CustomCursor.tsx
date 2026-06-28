"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/** A dot that tracks the pointer + a ring that lags behind and grows over
 *  interactive elements. Uses mix-blend-difference so it reads on any
 *  background. Desktop (fine pointer) only — touch keeps the native cursor. */
export default function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const ry = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(any-pointer: fine)").matches) return;
    document.documentElement.classList.add("has-custom-cursor");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      setHovered(!!t?.closest("a,button,[role=button],input,textarea,select,label,.cursor-pointer"));
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y]);

  return (
    <>
      <motion.div
        aria-hidden
        style={{ left: x, top: y }}
        className="fixed z-[1000] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white mix-blend-difference"
      />
      <motion.div
        aria-hidden
        style={{ left: rx, top: ry }}
        className="fixed z-[1000] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-white mix-blend-difference"
        animate={{
          width: hovered ? 58 : 34,
          height: hovered ? 58 : 34,
          opacity: down ? 0.5 : 1,
          borderWidth: hovered ? 1.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      />
    </>
  );
}
