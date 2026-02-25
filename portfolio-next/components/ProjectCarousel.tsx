"use client";

import { useRef, useEffect, useCallback } from "react";

/*
  ProjectCarousel
  ─────────────────────────────────────────
  • Mouse position inside the section drives horizontal scroll velocity.
    Dead-zone in the center (±DEAD_ZONE fraction) = no scroll.
    Velocity ramps from 0 → MAX_SPEED_PX as the cursor moves toward the edge.
  • Left / right edge overlays have `backdrop-filter: blur` + CSS mask so the
    blur is strongest at the very edge and dissolves toward center — cards appear
    to blur as they slide out of frame.
  • A solid color gradient overlay (page background color) sits on top of the
    blur overlay to cleanly clip the hard edge.
*/

const DEAD_ZONE = 0.20;   // centre fraction that produces no scroll
const MAX_SPEED = 14;     // px/frame at the very edge

const BLUR_OVERLAY = {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
} as const;

const MASK_LEFT = "linear-gradient(to right, black 0%, black 30%, transparent 100%)";
const MASK_RIGHT = "linear-gradient(to left,  black 0%, black 30%, transparent 100%)";

const FADE_LEFT = "linear-gradient(to right, #F5F5F7 0%, #F5F5F7 10%, transparent 100%)";
const FADE_RIGHT = "linear-gradient(to left,  #F5F5F7 0%, #F5F5F7 10%, transparent 100%)";

interface Props {
    children: React.ReactNode;
}

export default function ProjectCarousel({ children }: Props) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const velRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const activeRef = useRef(false); // only scroll when mouse is inside

    /* ── Mouse tracking ── */
    const onMouseMove = useCallback((e: MouseEvent) => {
        const section = sectionRef.current;
        if (!section) return;
        const { left, width } = section.getBoundingClientRect();
        const rel = (e.clientX - left) / width; // 0..1
        const c = rel - 0.5;                  // -0.5..0.5 (centered)
        const abs = Math.abs(c);

        if (abs < DEAD_ZONE * 0.5) {
            velRef.current = 0;
        } else {
            const t = Math.max(0, abs - DEAD_ZONE * 0.5) / (0.5 - DEAD_ZONE * 0.5);
            velRef.current = Math.sign(c) * t * t * MAX_SPEED; // quadratic ramp
        }
    }, []);

    const onMouseEnter = useCallback(() => { activeRef.current = true; }, []);
    const onMouseLeave = useCallback(() => {
        activeRef.current = false;
        velRef.current = 0;
    }, []);

    /* ── RAF scroll loop ── */
    useEffect(() => {
        const loop = () => {
            const track = trackRef.current;
            if (track && activeRef.current && Math.abs(velRef.current) > 0.01) {
                track.scrollLeft = Math.max(
                    0,
                    Math.min(track.scrollLeft + velRef.current, track.scrollWidth - track.clientWidth)
                );
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, []);

    /* ── Event listeners ── */
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        el.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mouseenter", onMouseEnter);
        el.addEventListener("mouseleave", onMouseLeave);
        return () => {
            el.removeEventListener("mousemove", onMouseMove);
            el.removeEventListener("mouseenter", onMouseEnter);
            el.removeEventListener("mouseleave", onMouseLeave);
        };
    }, [onMouseMove, onMouseEnter, onMouseLeave]);

    return (
        <div ref={sectionRef} className="relative overflow-hidden">

            {/* ── Blur overlays (behind the color fade) ─────── */}
            {/* Blur strongest at the very edge, fades to zero toward centre */}
            <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-40 z-10"
                style={{ ...BLUR_OVERLAY, WebkitMaskImage: MASK_LEFT, maskImage: MASK_LEFT }}
            />
            <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-40 z-10"
                style={{ ...BLUR_OVERLAY, WebkitMaskImage: MASK_RIGHT, maskImage: MASK_RIGHT }}
            />

            {/* ── Color fade overlays (on top, hides the hard clips) ── */}
            <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-20"
                style={{ background: FADE_LEFT }}
            />
            <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-20"
                style={{ background: FADE_RIGHT }}
            />

            {/* ── Scroll track ───────────────────────────────── */}
            <div
                ref={trackRef}
                className="flex gap-4 px-8 md:px-20 pb-6 overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "auto" }}
            >
                {children}
            </div>
        </div>
    );
}
