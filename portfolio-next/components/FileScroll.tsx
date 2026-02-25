"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
const CROP_TOP = 0.05;    // top black bar
const CROP_BOTTOM = 0.08; // bottom black bar + Veo watermark

// Focal point for cover-crop anchor (0 = left/top, 0.5 = center, 1 = right/bottom).
// On portrait (mobile) the 16:9 video is much wider than the viewport, so the
// visible horizontal slice is controlled by MOBILE_FOCUS_X.
// Tune MOBILE_FOCUS_X (0→1) to pan the crop left→right on phones.
const FOCUS_X = 0.5;        // landscape — horizontal anchor
const FOCUS_Y = 0.5;        // landscape — vertical anchor
const MOBILE_FOCUS_X = 0.5; // portrait  — tweak to pan left↔right
const MOBILE_FOCUS_Y = 0.4; // portrait  — slightly above center

function frameSrc(i: number) {
    return `/frames/${String(i + 1).padStart(5, "0")}.webp`;
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
        left: "left-5 md:left-16 lg:left-28 text-left items-start",
        right: "right-5 md:right-16 lg:right-28 text-right items-end",
    }[beat.align];

    return (
        <motion.div
            style={{ opacity, y }}
            className={`absolute bottom-[20%] md:bottom-[15%] flex flex-col gap-2 md:gap-3 pointer-events-none select-none ${alignClass}`}
        >
            <span className="text-[clamp(1.5rem,6vw,5rem)] font-black tracking-[-0.04em] text-black/85 leading-none">
                {beat.text}
            </span>
            <span className="text-[clamp(0.65rem,2.5vw,1.1rem)] font-light tracking-[0.12em] md:tracking-[0.18em] uppercase text-black/35">
                {beat.sub}
            </span>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   SCROLL NOTIFICATION
─────────────────────────────────────────────────────────────────── */
function ScrollNotification({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
    // Start visible immediately — new visitors see it right away
    const [visible, setVisible] = useState(true);
    // true = down chevron, false = up chevron (only relevant when not at frame 0)
    const [showDown, setShowDown] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper: (re)start the 3-second inactivity countdown
    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            // Show only while still inside the hero animation (progress < 1)
            if (scrollYProgress.get() < 1) setVisible(true);
        }, 3000);
    }, [scrollYProgress]);

    // Cleanup timer on unmount only (don't start a timer on mount — we show immediately)
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    // On every scroll event: hide the pill, restart the inactivity clock
    useMotionValueEvent(scrollYProgress, "change", (v) => {
        setVisible(false);
        // If we've exited the hero, don't bother resetting the timer
        if (v < 1) resetTimer();
    });


    // At frame 0 → only down arrow; elsewhere → blink up ↕ down every 900 ms
    useEffect(() => {
        if (!visible) return;
        const atStart = scrollYProgress.get() === 0;
        if (atStart) { setShowDown(true); return; }

        setShowDown(true); // start with down
        const interval = setInterval(() => setShowDown(d => !d), 900);
        return () => clearInterval(interval);
    }, [visible, scrollYProgress]);

    // Down path  ↓  and up path  ↑
    const downPath = "M3 5.5l5 5 5-5";
    const upPath = "M13 10.5l-5-5-5 5";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden={!visible}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none"
        >
            {/* Outer pill */}
            <div
                className="relative flex items-center gap-2.5 px-5 py-3 rounded-full"
                style={{
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06) inset",
                }}
            >
                {/* Pulsing glow behind the pill */}
                <span
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                        background: "rgba(255,255,255,0.25)",
                        filter: "blur(8px)",
                        animationDuration: "2s",
                    }}
                />

                {/* Chevron — blinking up ↕ down, or just down at frame 0 */}
                <motion.svg
                    key={showDown ? "down" : "up"}
                    initial={{ opacity: 0, y: showDown ? -4 : 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 text-black/50 relative"
                >
                    <path d={showDown ? downPath : upPath} />
                </motion.svg>

                {/* Label */}
                <span className="relative text-[11px] tracking-[0.18em] uppercase text-black/45 font-medium">
                    Scroll to explore
                </span>
            </div>
        </motion.div>
    );
}

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
    // Tiny offscreen canvas used for the blurred portrait background.
    // Reused across frames to avoid per-frame allocation.
    const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

        const isPortrait = ch > cw;

        // Portrait (mobile): contain — show full video frame with fog-color letterbox.
        // Landscape (desktop): cover — fill viewport edge-to-edge.
        const scale = isPortrait
            ? Math.min(cw / srcW, ch / srcH)
            : Math.max(cw / srcW, ch / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;

        // Contain always centers; cover uses focal-point anchoring.
        const fx = isPortrait ? 0.5 : FOCUS_X;
        const fy = isPortrait ? 0.5 : FOCUS_Y;
        const dx = isPortrait
            ? (cw - drawW) / 2
            : Math.min(0, Math.max(cw - drawW, (cw - drawW) * fx));
        const dy = isPortrait
            ? (ch - drawH) / 2
            : Math.min(0, Math.max(ch - drawH, (ch - drawH) * fy));

        ctx.fillStyle = FOG_COLOR;
        ctx.fillRect(0, 0, cw, ch);

        if (isPortrait) {
            // Portrait (mobile): two-pass render.
            // Pass 1 — static blurred background (always frame 0).
            // Background never changes — only the foreground animates with scroll.
            const BLUR_SCALE = 0.05;
            const bw = Math.max(1, Math.round(cw * BLUR_SCALE));
            const bh = Math.max(1, Math.round(ch * BLUR_SCALE));
            let bCanvas = blurCanvasRef.current;
            if (!bCanvas) { bCanvas = document.createElement("canvas"); blurCanvasRef.current = bCanvas; }
            // Only redraw blur canvas when viewport size changes.
            if (bCanvas.width !== bw || bCanvas.height !== bh) {
                bCanvas.width = bw;
                bCanvas.height = bh;
                const bgImg = imagesRef.current[0]; // always frame 0 — static sky
                const bCtx = bCanvas.getContext("2d");
                if (bCtx && bgImg?.complete && bgImg.naturalWidth > 0) {
                    const cs = Math.max(bw / srcW, bh / srcH);
                    bCtx.drawImage(bgImg, srcX, srcY, srcW, srcH,
                        (bw - srcW * cs) / 2, (bh - srcH * cs) / 2,
                        srcW * cs, srcH * cs);
                }
            }
            ctx.globalAlpha = 0.92;
            ctx.drawImage(bCanvas, 0, 0, cw, ch);
            ctx.globalAlpha = 1;

            // Pass 2 — sharp contain frame animates with scroll.
            ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, drawW, drawH);
        } else {
            // Landscape (desktop): single-pass cover, unchanged.
            ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, drawW, drawH);
        }
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
                    setTimeout(() => {
                        if (el) el.style.display = "none";
                        // Re-draw after overlay hides — fixes white flash if
                        // the first drawFrame(0) was a no-op because the canvas
                        // wasn't sized yet when the initial image loaded.
                        drawFrame(Math.max(0, lastFrameRef.current));
                    }, 700);
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
        <div ref={containerRef} className="relative h-[280vh] md:h-[400vh]">
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

                {/* Scroll nudge notification — appears after 3 s at frame 0 */}
                <ScrollNotification scrollYProgress={scrollYProgress} />


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
