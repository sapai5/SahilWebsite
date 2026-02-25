"use client";

import { useRef, useEffect, useCallback } from "react";

/*
  ProjectCarousel
  ─────────────────────────────────────────
  • Desktop: Mouse position drives horizontal scroll velocity with a dead-zone
    in the center. Velocity ramps quadratically toward the edges.
  • Mobile: Touch drag scrolls directly; releasing with momentum carries through
    with kinetic deceleration.
  • Left / right edge overlays have backdrop-filter blur + CSS mask.
*/

const DEAD_ZONE = 0.20;
const MAX_SPEED = 14;

const BLUR_OVERLAY = {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
} as const;

const MASK_LEFT = "linear-gradient(to right, black 0%, black 30%, transparent 100%)";
const MASK_RIGHT = "linear-gradient(to left,  black 0%, black 30%, transparent 100%)";
const FADE_LEFT = "linear-gradient(to right, #F5F5F7 0%, #F5F5F7 10%, transparent 100%)";
const FADE_RIGHT = "linear-gradient(to left,  #F5F5F7 0%, #F5F5F7 10%, transparent 100%)";

interface Props { children: React.ReactNode; }

export default function ProjectCarousel({ children }: Props) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const velRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const activeRef = useRef(false);

    // Touch state
    const touchStartX = useRef(0);
    const touchLastX = useRef(0);
    const touchVelRef = useRef(0); // kinetic velocity on release

    /* ── Mouse tracking ── */
    const onMouseMove = useCallback((e: MouseEvent) => {
        const section = sectionRef.current;
        if (!section) return;
        const { left, width } = section.getBoundingClientRect();
        const rel = (e.clientX - left) / width;
        const c = rel - 0.5;
        const abs = Math.abs(c);
        if (abs < DEAD_ZONE * 0.5) {
            velRef.current = 0;
        } else {
            const t = Math.max(0, abs - DEAD_ZONE * 0.5) / (0.5 - DEAD_ZONE * 0.5);
            velRef.current = Math.sign(c) * t * t * MAX_SPEED;
        }
    }, []);

    const onMouseEnter = useCallback(() => { activeRef.current = true; }, []);
    const onMouseLeave = useCallback(() => { activeRef.current = false; velRef.current = 0; }, []);

    /* ── Touch tracking ── */
    const onTouchStart = useCallback((e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchLastX.current = e.touches[0].clientX;
        touchVelRef.current = 0;
        velRef.current = 0;
        activeRef.current = false; // disable mouse-driven scroll during touch
    }, []);

    const onTouchMove = useCallback((e: TouchEvent) => {
        const track = trackRef.current;
        if (!track) return;
        const x = e.touches[0].clientX;
        const dx = touchLastX.current - x;
        touchVelRef.current = dx;          // remember last delta for kinetic release
        touchLastX.current = x;
        track.scrollLeft = Math.max(0, Math.min(track.scrollLeft + dx, track.scrollWidth - track.clientWidth));
    }, []);

    const onTouchEnd = useCallback(() => {
        // Hand off touch momentum to the RAF loop
        velRef.current = touchVelRef.current * 0.8; // slight damping on hand-off
        activeRef.current = true;
    }, []);

    /* ── RAF scroll loop (mouse velocity + kinetic touch deceleration) ── */
    useEffect(() => {
        const loop = () => {
            const track = trackRef.current;
            if (track && Math.abs(velRef.current) > 0.1) {
                if (activeRef.current) {
                    track.scrollLeft = Math.max(0, Math.min(
                        track.scrollLeft + velRef.current,
                        track.scrollWidth - track.clientWidth
                    ));
                }
                // Decelerate kinetic momentum (mouse loop keeps velocity constant while
                // mouse is held; once mouse leaves activeRef becomes false and velocity
                // was zeroed above — so this only runs after touch release)
                if (!activeRef.current || !sectionRef.current?.matches(":hover")) {
                    velRef.current *= 0.92;
                }
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
        // Mouse
        el.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mouseenter", onMouseEnter);
        el.addEventListener("mouseleave", onMouseLeave);
        // Touch
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
        return () => {
            el.removeEventListener("mousemove", onMouseMove);
            el.removeEventListener("mouseenter", onMouseEnter);
            el.removeEventListener("mouseleave", onMouseLeave);
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [onMouseMove, onMouseEnter, onMouseLeave, onTouchStart, onTouchMove, onTouchEnd]);

    return (
        <div ref={sectionRef} className="relative overflow-hidden">

            {/* ── Blur overlays ─────── */}
            <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-40 z-10"
                style={{ ...BLUR_OVERLAY, WebkitMaskImage: MASK_LEFT, maskImage: MASK_LEFT }}
            />
            <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-40 z-10"
                style={{ ...BLUR_OVERLAY, WebkitMaskImage: MASK_RIGHT, maskImage: MASK_RIGHT }}
            />

            {/* ── Color fade overlays ── */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 md:w-24 z-20" style={{ background: FADE_LEFT }} />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 md:w-24 z-20" style={{ background: FADE_RIGHT }} />

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
