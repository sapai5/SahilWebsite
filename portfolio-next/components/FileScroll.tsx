"use client";

import { useEffect, useRef, useCallback } from "react";
import {
    useScroll,
    useMotionValueEvent,
    useTransform,
    useSpring,
    motion,
} from "framer-motion";
import type { MotionValue } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────
   CONFIGURATION
───────────────────────────────────────────────────────────────── */
const TOTAL_FRAMES = 192;
const FOG_COLOR = "#E8E8E8";

// Crop fractions to remove baked-in letterbox bars + Veo watermark.
// CROP_TOP skips the black strip at the top, CROP_BOTTOM skips the bottom.
// Adjust each independently — 0.05 = skip 5% of the raw frame height.
const CROP_TOP = 0.05;  // top black bar
const CROP_BOTTOM = 0.08;  // bottom black bar + Veo watermark

function frameSrc(i: number) {
    return `/frames/${String(i + 1).padStart(5, "0")}.png`;
}

/* ─────────────────────────────────────────────────────────────────
   TEXT OVERLAY BEATS
───────────────────────────────────────────────────────────────── */
const BEATS = [
    { from: 0.0, to: 0.12, text: "Sahil's Portfolio.", sub: "Engineered clarity.", align: "center" as const },
    { from: 0.22, to: 0.37, text: "Built for Precision.", sub: "Every detail, measured.", align: "left" as const },
    { from: 0.54, to: 0.70, text: "Layered Engineering.", sub: "See what's inside.", align: "right" as const },
    { from: 0.84, to: 1.0, text: "Assembled. Ready.", sub: "Scroll to explore.", align: "center" as const },
];

/* ─────────────────────────────────────────────────────────────────
   TEXT BEAT COMPONENT
───────────────────────────────────────────────────────────────── */
function TextBeat({
    beat,
    scrollYProgress,
}: {
    beat: (typeof BEATS)[number];
    scrollYProgress: MotionValue<number>;
}) {
    const mid = (beat.from + beat.to) / 2;
    const fadeInEnd = beat.from + (mid - beat.from) * 0.4;
    const fadeOutStart = mid + (beat.to - mid) * 0.6;

    const opacity = useTransform(
        scrollYProgress,
        [beat.from, fadeInEnd, fadeOutStart, beat.to],
        [0, 1, 1, 0]
    );
    const y = useTransform(scrollYProgress, [beat.from, fadeInEnd], [18, 0]);

    const alignClass = {
        center: "left-1/2 -translate-x-1/2 text-center items-center",
        left: "left-8 md:left-16 lg:left-28 text-left items-start",
        right: "right-8 md:right-16 lg:right-28 text-right items-end",
    }[beat.align];

    return (
        <motion.div
            style={{ opacity, y }}
            className={`absolute bottom-[15%] flex flex-col gap-3 pointer-events-none select-none ${alignClass}`}
        >
            <span className="text-[clamp(1.8rem,5.5vw,5rem)] font-black tracking-[-0.04em] text-black/85 leading-none">
                {beat.text}
            </span>
            <span className="text-[clamp(0.75rem,1.5vw,1.1rem)] font-light tracking-[0.18em] uppercase text-black/35">
                {beat.sub}
            </span>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function FileScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const loadedCountRef = useRef(0);
    const loadingDivRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressTextRef = useRef<HTMLSpanElement>(null);
    const lastFrameRef = useRef(-1);
    const rafRef = useRef<number | null>(null);
    const cssSizeRef = useRef({ w: 0, h: 0 });

    /* ── Scroll tracking ── */
    const { scrollYProgress } = useScroll({ target: containerRef });
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 22,
        restDelta: 0.0005,
    });

    /* ── Exit transition: blur + fog fade ── */
    const blurPx = useTransform(smoothProgress, [0.80, 0.96], [0, 14]);
    const blurStyle = useTransform(blurPx, (v) => `blur(${v}px)`);
    const fogOpacity = useTransform(smoothProgress, [0.90, 1.0], [0, 1]);

    /* ── Draw helper ── */
    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const img = imagesRef.current[frameIndex];
        if (!img || !img.complete || img.naturalWidth === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { w: cw, h: ch } = cssSizeRef.current;
        if (cw === 0 || ch === 0) return;

        const srcX = 0;
        const srcY = Math.floor(img.naturalHeight * CROP_TOP);
        const srcW = img.naturalWidth;
        const srcH = Math.floor(img.naturalHeight * (1 - CROP_TOP - CROP_BOTTOM));

        const scale = Math.max(cw / srcW, ch / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const dx = (cw - drawW) / 2;
        const dy = (ch - drawH) / 2;

        ctx.fillStyle = FOG_COLOR;
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, drawW, drawH);
    }, []);

    /* ── Resize handler ── */
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.offsetWidth;
        const cssH = canvas.offsetHeight;

        // Back the canvas in DEVICE pixels for crisp retina rendering.
        // cssSizeRef stores device px so drawFrame uses the right dimensions.
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        // cssSizeRef must stay in CSS pixels — drawFrame draws in the CSS-pixel
        // coordinate space established by ctx.scale(dpr, dpr), so using device
        // pixels here would mis-centre the cover-fit calculation.
        cssSizeRef.current = { w: cssW, h: cssH };

        // Reset the transform to identity BEFORE scaling — avoids accumulation
        // on repeated resize calls which would make the image progressively smaller.
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
            ctx.scale(dpr, dpr);                 // now scale once cleanly
        }

        if (lastFrameRef.current >= 0) drawFrame(lastFrameRef.current);
    }, [drawFrame]);

    /* ── Image preloading ── */
    useEffect(() => {
        const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
        imagesRef.current = images;
        let mounted = true;

        const onLoad = () => {
            if (!mounted) return;
            loadedCountRef.current += 1;
            const pct = Math.round((loadedCountRef.current / TOTAL_FRAMES) * 100);

            if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
            if (progressTextRef.current) progressTextRef.current.textContent = `${pct}%`;

            if (loadedCountRef.current === 1) {
                lastFrameRef.current = 0;
                drawFrame(0);
            }
            if (loadedCountRef.current >= TOTAL_FRAMES) {
                const el = loadingDivRef.current;
                if (el) {
                    el.style.transition = "opacity 0.6s ease";
                    el.style.opacity = "0";
                    setTimeout(() => { if (el) el.style.display = "none"; }, 700);
                }
            }
        };

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new window.Image();
            img.src = frameSrc(i);
            img.onload = onLoad;
            img.onerror = onLoad;
            images[i] = img;
        }
        return () => { mounted = false; };
    }, [drawFrame]);

    /* ── Canvas sizing + resize observer ── */
    useEffect(() => {
        handleResize();
        const ro = new ResizeObserver(handleResize);
        if (canvasRef.current) ro.observe(canvasRef.current);
        return () => ro.disconnect();
    }, [handleResize]);

    /* ── Scroll → frame (lerped for sub-frame smoothness) ── */
    useMotionValueEvent(smoothProgress, "change", (smoothVal) => {
        // Blend 70% smooth spring + 30% raw position → fluid but never ahead of scroll.
        const raw = scrollYProgress.get();
        const blended = smoothVal * 0.7 + raw * 0.3;
        const frameIndex = Math.min(
            Math.max(Math.floor(blended * (TOTAL_FRAMES - 1)), 0),
            TOTAL_FRAMES - 1
        );
        lastFrameRef.current = frameIndex;
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            drawFrame(frameIndex);
            rafRef.current = null;
        });
    });

    return (
        <div ref={containerRef} className="relative h-[400vh]">
            <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background: FOG_COLOR }}>

                {/* Canvas — fills entire sticky viewport */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ background: FOG_COLOR }}
                />

                {/* Text overlay beats */}
                {BEATS.map((beat, i) => (
                    <TextBeat key={i} beat={beat} scrollYProgress={smoothProgress} />
                ))}

                {/* ── EXIT TRANSITION ── */}
                {/* Layer 1: temporal blur — frosted-glass feel as the frame fades out */}
                <motion.div
                    style={{ backdropFilter: blurStyle }}
                    className="absolute inset-0 pointer-events-none"
                />
                {/* Layer 2: fog fade — dissolves cleanly into the Apple UI below */}
                <motion.div
                    style={{ opacity: fogOpacity, backgroundColor: '#F5F5F7' }}
                    className="absolute inset-0 pointer-events-none"
                />

                {/* Loading overlay */}
                <div
                    ref={loadingDivRef}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5"
                    style={{ background: FOG_COLOR }}
                >
                    <div className="relative w-9 h-9">
                        <div className="absolute inset-0 rounded-full border-[1.5px] border-black/10" />
                        <div
                            className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-black/40 animate-spin"
                            style={{ animationDuration: "0.75s" }}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] tracking-[0.22em] uppercase text-black/25 font-medium">
                            Loading Sahil&apos;s Portfolio…
                        </span>
                        <div className="w-36 h-px bg-black/10 overflow-hidden rounded-full">
                            <div
                                ref={progressBarRef}
                                className="h-full bg-black/25 rounded-full"
                                style={{ width: "0%", transition: "width 0.1s linear" }}
                            />
                        </div>
                        <span ref={progressTextRef} className="text-[9px] tracking-widest text-black/20 tabular-nums">
                            0%
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
