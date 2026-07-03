"use client";

import {
    useRef,
    useState,
    useEffect,
    useMemo,
    useCallback,
    Component,
    type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    useScroll,
    useSpring,
    useTransform,
    useMotionValueEvent,
    motion,
    useInView,
    type MotionValue,
} from "framer-motion";
import * as THREE from "three";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { SparkRenderer } from "./spark/SparkRenderer";
import { SplatMesh } from "./spark/SplatMesh";
import { makeRevealModifier } from "./spark/revealModifier";
import ScrollPrompt from "./ScrollPrompt";

/* ─────────────────────────────────────────────────────────────────
   CONFIG
   ─────────────────────────────────────────────────────────────────
   The hero renders a World Labs Marble world (3D Gaussian splats).

   Primary source: a pre-built Level-of-Detail tree (.rad) streamed in chunks
   via `paged: true`. Spark renders only a per-platform splat budget each frame
   (≈2.5M desktop / 1.5M iOS / 1M Android) regardless of the world's true size
   (~2.7M splats here), so it runs smoothly on low-end devices the way World
   Labs' own Marble viewer does — and `paged` fetches only the chunks the
   current viewpoint needs, so it uses less bandwidth than the full .spz.

   Build the .rad locally (one-time) and commit it:
     npm run build-lod -- public/worlds/hero/world.spz --quality --rad-chunked
   (requires Rust; outputs world-lod.rad + world-lod-N.radc into public/.)

   Fallback: the original .spz with runtime LoD (`lod: true`). Used if the .rad
   isn't present (HEAD probe fails). Override the fallback path with
   NEXT_PUBLIC_HERO_WORLD_URL. */
const HERO_RAD_URL = "/worlds/hero/world-lod.rad";
const HERO_SPZ_URL =
    process.env.NEXT_PUBLIC_HERO_WORLD_URL || "/worlds/hero/world.spz";

/* Orientation + framing of the world. Marble/most splat captures are
   Y-down relative to THREE's Y-up, so we flip 180° about X by default.
   Tune these once you drop in your real world. */
const WORLD_QUATERNION: [number, number, number, number] = [1, 0, 0, 0]; // 180° about X
const WORLD_SCALE = 1.4;

/* Hero camera path — first-person "run" through the valley, then a 180° turn to
   face the waterfall. Tune these to taste.
   - CAM_START_Z: where you start (smaller / negative = deeper into the scene).
   - CAM_RUN_LEN: how far you travel forward as you scroll.
   - CAM_BASE_Y:  eye height.
   - CAM_TURN_START: scroll fraction (0–1) at which the turn-around begins.
   If the mountains/waterfall end up swapped, flip CAM_TURN_DIR. */
const CAM_START_Z = 1.2;
const CAM_RUN_LEN = 10.0;
const CAM_BASE_Y = 0.12;
const CAM_TURN_START = 0.6;
const CAM_TURN_END = 0.82; // turn completes here; the fade-out begins after this
const CAM_TURN_DIR = 1; // +1 or -1 — direction of the 180° turn
const CAM_CURVE_X = 1.5; // lateral meander amplitude (canyon weave)
const CAM_CURVE_Y = 0.5; // vertical variance amplitude (rises / dips)
// Lateral offset of the whole path so it sits in the middle of the canyon
// rather than buried in the left wall. Positive = shift right; tune to centre.
const CAM_X_OFFSET = 2.0;
// Extra eye-height at the start that eases back down to CAM_BASE_Y by
// CAM_LIFT_EASE of total scroll (so the hero opens looking out from up high).
const CAM_START_LIFT = 1.0;
const CAM_LIFT_EASE = 0.4;
// Scroll-run fraction over which the canyon weave eases in. Keeps the opening a
// straight forward run instead of an immediate diagonal slide to the side.
const CAM_MEANDER_EASE = 0.4;
// Initial look offset (radians) so the hero opens facing the valley rather than
// the rock wall the path tangent points at. Positive = look left; negate to look
// right. It eases back to the path heading over the first CAM_YAW_EASE of scroll.
const CAM_START_YAW = 0.57;
const CAM_YAW_EASE = 0.25;

// Duration (seconds) of the "point cloud → render" intro bloom.
const REVEAL_DURATION = 0.65;
// How long the point cloud lingers (seconds) before it starts building the world.
const REVEAL_LINGER = 0.6;
// Scroll fraction at which the world dissolves back into a point cloud on exit.
const REVEAL_EXIT_START = 0.62;

/* ─────────────────────────────────────────────────────────────────
   SPLAT CAPABILITY DETECTION
   ─────────────────────────────────────────────────────────────────
   One probe decides two things, from a SINGLE WebGL2 context:

   1. `capable` — Spark needs WebGL2, and must NOT be a software renderer
      (SwiftShader / llvmpipe / "Microsoft Basic Render"), which would run
      splats on the CPU and freeze/OOM. Also gate out <2 GB RAM devices.

   2. `liveReveal` — whether the per-frame reveal re-bake (our objectModifier +
      generatorDirty) is affordable. It's cheap on Metal/unified memory (Mac/iOS)
      but ruinous on the Windows ANGLE→Direct3D11 path, so we render the stock
      LoD world there (like Marble) with no per-frame re-baking.

   CRITICAL: the probe context is created with powerPreference:"high-performance"
   and released immediately. On Windows laptops the browser tends to pin the
   whole page to the GPU of the FIRST WebGL context created — a default/low-power
   probe would strand the entire page on the integrated GPU (freeze) even when a
   discrete GPU (e.g. RTX 3060) is present. Requesting high-performance here (and
   on the main Canvas) keeps everything on the discrete GPU. */
const SOFTWARE_RENDERER_RE =
    /swiftshader|llvmpipe|software|basic render|microsoft basic|angle \(software/i;

type HeroSupport = { capable: boolean; liveReveal: boolean };

function detectHeroSupport(): HeroSupport {
    if (typeof window === "undefined") return { capable: false, liveReveal: false };
    try {
        const gl = document.createElement("canvas").getContext("webgl2", {
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
        }) as WebGL2RenderingContext | null;
        if (!gl) return { capable: false, liveReveal: false }; // Spark needs WebGL2

        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
        const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

        const software = SOFTWARE_RENDERER_RE.test(renderer);
        const lowMem = typeof mem === "number" && mem > 0 && mem < 2;
        const capable = !software && !lowMem;

        // Per-frame re-bake only where it's cheap: not the Direct3D/Windows path.
        const isWindows = /Windows/i.test(navigator.userAgent || "");
        const isDirect3D = /direct3d|\bd3d/i.test(renderer);
        const liveReveal = capable && !isWindows && !isDirect3D;

        // Release the probe context so it doesn't hold a GPU/context slot.
        gl.getExtension("WEBGL_lose_context")?.loseContext();

        return { capable, liveReveal };
    } catch {
        return { capable: false, liveReveal: false };
    }
}

/* ─────────────────────────────────────────────────────────────────
   ERROR BOUNDARY — falls back to a static backdrop if the splat scene
   throws (e.g. WASM/asset failure) instead of blanking the whole page.
───────────────────────────────────────────────────────────────── */
class WorldErrorBoundary extends Component<
    { children: ReactNode; onError: () => void },
    { hasError: boolean }
> {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch() {
        this.props.onError();
    }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

/* ─────────────────────────────────────────────────────────────────
   SPLAT WORLD SCENE (inside the R3F Canvas)
───────────────────────────────────────────────────────────────── */
function SplatWorld({
    url,
    paged,
    liveReveal,
    smooth,
    onProgress,
    onLoad,
    onIntroComplete,
}: {
    url: string;
    paged: boolean;
    liveReveal: boolean;
    smooth: MotionValue<number>;
    onProgress: (e: ProgressEvent) => void;
    onLoad: () => void;
    onIntroComplete: () => void;
}) {
    const renderer = useThree((s) => s.gl);
    const camera = useThree((s) => s.camera);
    const meshRef = useRef<SparkSplatMesh>(null);

    // Memoize constructor args so R3F doesn't rebuild the renderer/mesh each render.
    // On the Direct3D/Windows path, render a much smaller LoD splat budget
    // (lodSplatScale) — fragment overdraw + the per-frame sort are the render
    // bottleneck there, and D3D11 handles them far less efficiently than Metal.
    const sparkArgs = useMemo(
        () => ({ renderer, lodSplatScale: liveReveal ? 1.0 : 0.45 }),
        [renderer, liveReveal],
    );
    // "Point cloud → render" reveal modifier + its driving uniforms.
    const { reveal, camPos, modifier } = useMemo(() => makeRevealModifier(), []);
    const revealStart = useRef(-1);
    const lastReveal = useRef(-1);
    const introDone = useRef(false);
    const camLocal = useMemo(() => new THREE.Vector3(), []);
    const splatArgs = useMemo(() => {
        // Only attach the reveal objectModifier where per-frame re-baking is cheap
        // (Metal/unified memory). On Direct3D/Windows we render the stock LoD world
        // (no modifier, no generatorDirty) so it doesn't freeze/OOM.
        const base = paged
            ? { url, paged: true as const, onProgress, onLoad }
            : { url, lod: true as const, onProgress, onLoad };
        return liveReveal ? { ...base, objectModifiers: [modifier] } : base;
    }, [url, paged, liveReveal, onProgress, onLoad, modifier]);

    // First-person "running" camera, driven by scroll.
    const lookTarget = useMemo(() => new THREE.Vector3(0, CAM_BASE_Y, -1), []);
    const tinted = useRef(false);
    useFrame((state, delta) => {
        const p = smooth.get(); // 0 → 1 across the hero scroll
        const t = state.clock.elapsedTime;

        // Marble bakes fairly muted color — lift it a touch once the splats load.
        const mesh = meshRef.current as (SparkSplatMesh & { isInitialized?: boolean; recolor?: THREE.Color; generatorDirty?: boolean }) | null;
        if (liveReveal && mesh && !tinted.current && mesh.isInitialized && mesh.recolor) {
            mesh.recolor.setRGB(1.14, 1.1, 1.04); // subtle warm brightness lift
            tinted.current = true;
        }

        if (!liveReveal) {
            // Direct3D/Windows path: no per-frame re-baking. Render the stock LoD
            // world (Marble-parity) and just release the scroll lock once the
            // splats are initialized. Intro/exit are handled by the canvas opacity
            // fade instead of a point-cloud reveal.
            if (mesh && mesh.isInitialized && !introDone.current) {
                introDone.current = true;
                onIntroComplete();
            }
        } else if (mesh && mesh.isInitialized) {
            // "Point cloud" lifecycle (Metal/unified-memory only):
            //  • intro — linger as points, then bloom into the world (time-based)
            //  • exit  — dissolve back into points as you scroll out (scroll-based)
            // We only re-run the generator while the value is actually changing.
            if (revealStart.current < 0) {
                revealStart.current = t;
                // Capture the camera's position in the splat's local space so the
                // reveal expands from the viewer, using the splats as the depth map.
                const m = mesh as unknown as THREE.Object3D;
                m.updateWorldMatrix(true, false);
                camLocal.copy(camera.position);
                m.worldToLocal(camLocal);
                camPos.value.copy(camLocal);
            }
            const introP = THREE.MathUtils.clamp(
                (t - revealStart.current - REVEAL_LINGER) / REVEAL_DURATION,
                0,
                1,
            );
            if (introP >= 1 && !introDone.current) {
                introDone.current = true;
                onIntroComplete(); // world is built — release scroll lock
            }
            // Ease-in (x^2): the front starts slow and accelerates through depth.
            const introEased = introP * introP;
            const exitP = 1 - THREE.MathUtils.smoothstep(p, REVEAL_EXIT_START, 1.0);
            const target = Math.min(introEased, exitP);
            if (Math.abs(target - lastReveal.current) > 0.002) {
                /* eslint-disable react-hooks/immutability */
                reveal.value = target;
                mesh.generatorDirty = true;
                /* eslint-enable react-hooks/immutability */
                lastReveal.current = target;
            }
        }

        // Footstep bob + sway for a first-person "running" feel.
        const bob = Math.sin(t * 2.6) * 0.02;
        const sway = Math.sin(t * 1.3) * 0.015;

        const runP = Math.min(p / CAM_TURN_START, 1);
        const turnP = THREE.MathUtils.smoothstep(p, CAM_TURN_START, CAM_TURN_END);

        // Meandering path that follows the canyon rather than a straight line.
        // The weave eases in (CAM_MEANDER_EASE) so the opening reads as a forward
        // run rather than an immediate sideways slide.
        const meander = THREE.MathUtils.smoothstep(runP, 0, CAM_MEANDER_EASE);
        const lift = CAM_START_LIFT * (1 - THREE.MathUtils.smoothstep(p, 0, CAM_LIFT_EASE));
        const a = runP * Math.PI;
        const px = CAM_X_OFFSET + Math.sin(a * 1.4) * CAM_CURVE_X * meander + sway;
        const py = CAM_BASE_Y + lift + Math.sin(a * 0.8) * CAM_CURVE_Y * meander + bob;
        const pz = CAM_START_Z - runP * CAM_RUN_LEN;

        // Path tangent → the camera looks along the direction it's travelling,
        // so it reads as following the canyon instead of strafing.
        const tx = Math.cos(a * 1.4) * 1.4 * Math.PI * CAM_CURVE_X * meander;
        const ty = Math.cos(a * 0.8) * 0.8 * Math.PI * CAM_CURVE_Y * meander;
        const tz = -CAM_RUN_LEN;

        // Rotate the heading for the 180° turn-around toward the waterfall at the end,
        // plus an initial yaw so we open looking at the valley (eases out as we run).
        const startYaw =
            CAM_START_YAW * (1 - THREE.MathUtils.smoothstep(p, 0, CAM_YAW_EASE));
        const th = startYaw + CAM_TURN_DIR * turnP * Math.PI;
        const ct = Math.cos(th);
        const st = Math.sin(th);
        const lx = tx * ct + tz * st;
        const lz = -tx * st + tz * ct;

        /* eslint-disable react-hooks/immutability */
        camera.position.x = THREE.MathUtils.damp(camera.position.x, px, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, py, 5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, pz, 4.5, delta);
        lookTarget.set(camera.position.x + lx, camera.position.y + ty, camera.position.z + lz);
        camera.lookAt(lookTarget);
        /* eslint-enable react-hooks/immutability */
    });

    return (
        <>
            <SparkRenderer args={[sparkArgs]} />
            <SplatMesh
                ref={meshRef}
                args={[splatArgs]}
                quaternion={WORLD_QUATERNION}
                scale={WORLD_SCALE}
            />
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────
   PERFORMANCE GUARD — adaptive quality / fallback
   ─────────────────────────────────────────────────────────────────
   Samples FPS once the scene is interactive. If it stays low (weak/integrated
   GPU, or a software-WebGL fallback as on a GPU-less Windows box), it first
   drops the render resolution a step at a time, then — if still too slow — bails
   to the static backdrop via onFallback. Lives inside the Canvas so it can use
   the R3F render loop and setDpr.
───────────────────────────────────────────────────────────────── */
const PERF_LOW_FPS = 30; // below this is "too slow"
const PERF_WARMUP_MS = 1200; // ignore the first beat after intro (things settling)
const PERF_LOW_STREAK = 2; // consecutive low-FPS seconds before acting (ignore hitches)
const DPR_STEPS = [1.0, 0.7]; // progressive resolution drops below the initial cap

function PerfGuard({ armed, onFallback }: { armed: boolean; onFallback: () => void }) {
    const setDpr = useThree((s) => s.setDpr);
    const frames = useRef(0);
    const windowStart = useRef(0);
    const warmupStart = useRef(0);
    const lowStreak = useRef(0);
    const step = useRef(-1); // -1 = initial cap; indexes into DPR_STEPS as it degrades

    useFrame(() => {
        if (!armed) return;
        const now = performance.now();
        if (warmupStart.current === 0) {
            warmupStart.current = now;
            windowStart.current = now;
            return;
        }
        if (now - warmupStart.current < PERF_WARMUP_MS) return;

        frames.current++;
        const dt = now - windowStart.current;
        if (dt < 1000) return; // measure in ~1s windows

        const fps = (frames.current * 1000) / dt;
        frames.current = 0;
        windowStart.current = now;

        if (fps >= PERF_LOW_FPS) {
            lowStreak.current = 0;
            return;
        }
        lowStreak.current += 1;
        if (lowStreak.current < PERF_LOW_STREAK) return;
        lowStreak.current = 0;

        if (step.current < DPR_STEPS.length - 1) {
            step.current += 1;
            setDpr(DPR_STEPS[step.current]); // lower resolution and re-measure
        } else {
            onFallback(); // exhausted resolution drops — fall back to static
        }
    });

    return null;
}

/* ─────────────────────────────────────────────────────────────────
   TEXT BEATS — fade in/out across scroll progress
───────────────────────────────────────────────────────────────── */
const BEATS = [
    { from: 0.0, to: 0.18, text: "Sahil A. Pai", sub: "Software Engineer", align: "center" as const },
    { from: 0.26, to: 0.46, text: "Hobbyist", sub: "Coding, Basketball, Hiking", align: "left" as const },
    { from: 0.54, to: 0.74, text: "PNW resident", sub: "Based in Portland", align: "right" as const },
    { from: 0.82, to: 1.0, text: "Step inside.", sub: "Scroll to explore", align: "center" as const },
];

function TextBeat({
    beat,
    smooth,
}: {
    beat: (typeof BEATS)[number];
    smooth: MotionValue<number>;
}) {
    const mid = (beat.from + beat.to) / 2;
    const fadeInEnd = beat.from + (mid - beat.from) * 0.4;
    const fadeOutStart = mid + (beat.to - mid) * 0.6;

    const opacity = useTransform(
        smooth,
        [beat.from, fadeInEnd, fadeOutStart, beat.to],
        [0, 1, 1, 0],
    );
    const y = useTransform(smooth, [beat.from, fadeInEnd], [18, 0]);

    const alignClass = {
        center: "left-1/2 -translate-x-1/2 text-center items-center",
        left: "left-5 md:left-16 lg:left-28 text-left items-start",
        right: "right-5 md:right-16 lg:right-28 text-right items-end",
    }[beat.align];

    return (
        <motion.div
            style={{ opacity, y }}
            className={`absolute bottom-[20%] md:bottom-[15%] z-10 flex flex-col gap-2 md:gap-3 pointer-events-none select-none ${alignClass}`}
        >
            <span className="text-[clamp(1.5rem,6vw,5rem)] font-black tracking-[-0.04em] text-white/90 leading-none drop-shadow-lg">
                {beat.text}
            </span>
            {beat.sub && (
                <span className="text-[clamp(0.65rem,2.5vw,1.1rem)] font-light tracking-[0.12em] md:tracking-[0.18em] uppercase text-white/55 drop-shadow-md">
                    {beat.sub}
                </span>
            )}
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   LOADING OVERLAY
───────────────────────────────────────────────────────────────── */
function LoadingOverlay({ progress }: { progress: number }) {
    // Starts white with dark UI ("Generating world…" reads better light), then
    // cross-fades to black with light UI as loading nears completion so it
    // matches the black hero behind it the moment the overlay unmounts.
    const t = Math.max(0, Math.min(1, (progress - 70) / 30)); // 0 until 70% → 1 at 100%
    const lerp = (a: number, b: number) => a + (b - a) * t;
    const bg = `rgb(${lerp(238, 0)}, ${lerp(241, 0)}, ${lerp(246, 0)})`; // #eef1f6 → black
    const fg = (alpha: number) => `rgba(${lerp(0, 255)}, ${lerp(0, 255)}, ${lerp(0, 255)}, ${alpha})`;

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5"
            style={{ backgroundColor: bg, transition: "background-color 0.25s linear" }}
        >
            <div className="relative w-9 h-9">
                <div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `1.5px solid ${fg(0.1)}` }}
                />
                <div
                    className="absolute inset-0 rounded-full animate-spin"
                    style={{
                        border: "1.5px solid transparent",
                        borderTopColor: fg(0.4),
                        animationDuration: "0.75s",
                    }}
                />
            </div>
            <div className="flex flex-col items-center gap-2">
                <span
                    className="text-[10px] tracking-[0.22em] uppercase font-medium"
                    style={{ color: fg(0.28) }}
                >
                    Generating world…
                </span>
                <div
                    className="w-36 h-px overflow-hidden rounded-full"
                    style={{ backgroundColor: fg(0.1) }}
                >
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: fg(0.32),
                            transition: "width 0.15s linear",
                        }}
                    />
                </div>
                <span
                    className="text-[9px] tracking-widest tabular-nums"
                    style={{ color: fg(0.22) }}
                >
                    {progress}%
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN HERO
───────────────────────────────────────────────────────────────── */
export default function WorldHero({ onReady }: { onReady?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const [loaded, setLoaded] = useState(false);
    // One capability probe (single high-performance WebGL2 context) decides both
    // whether we can run splats at all and whether the per-frame reveal is safe.
    const [support] = useState(detectHeroSupport);
    // Scroll is locked while the world builds; only if the device can render it.
    const [locked, setLocked] = useState(support.capable);
    // Arm the adaptive performance guard once the scene is interactive.
    const [perfArmed, setPerfArmed] = useState(false);
    const handleIntroComplete = useCallback(() => {
        setLocked(false);
        setPerfArmed(true);
    }, []);
    const [webgl, setWebgl] = useState(support.capable);
    // Whether per-frame reveal re-baking is safe (Metal/unified memory) vs the
    // Direct3D/Windows path where we render the stock LoD world instead.
    const [liveReveal] = useState(support.liveReveal);
    // #1 — cap the render resolution. Fragment overdraw scales with pixel count,
    // so this is a big lever, especially on the Direct3D/Windows path where we
    // clamp harder (1.0) than on Metal (1.5).
    const initialDpr = useMemo(
        () =>
            Math.min(
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
                liveReveal ? 1.5 : 1.0,
            ),
        [liveReveal],
    );
    // #3 — if rendering stays too slow even after lowering resolution, bail to the
    // static backdrop (covers software-WebGL fallbacks and GPU-less machines).
    const handlePerfFallback = useCallback(() => setWebgl(false), []);

    // Choose the world source: prefer the streamed LoD tree (.rad), fall back to
    // the raw .spz with runtime LoD if the .rad isn't deployed. A tiny HEAD probe
    // of the 5 KB .rad header decides, since SplatMesh has no onError hook.
    const [world, setWorld] = useState<{ url: string; paged: boolean } | null>(null);
    useEffect(() => {
        let cancelled = false;
        fetch(HERO_RAD_URL, { method: "HEAD" })
            .then((res) => {
                if (cancelled) return;
                setWorld(
                    res.ok
                        ? { url: HERO_RAD_URL, paged: true }
                        : { url: HERO_SPZ_URL, paged: false },
                );
            })
            .catch(() => {
                if (!cancelled) setWorld({ url: HERO_SPZ_URL, paged: false });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        // Force scroll to top on reload so the hero starts at the beginning.
        if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);
        // The hero is now mounted and owns the screen — let the page lift its
        // boot splash (we render our own loading overlay from here on).
        onReady?.();
    }, [onReady]);

    // Lock page scroll while the world builds in; release when the intro
    // completes (driven by the splat reveal in SplatWorld).
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        if (locked) {
            html.style.overflow = "hidden";
            body.style.overflow = "hidden";
        } else {
            html.style.overflow = "";
            body.style.overflow = "";
        }
        return () => {
            html.style.overflow = "";
            body.style.overflow = "";
        };
    }, [locked]);

    // Hard safety net: never keep scroll locked beyond a maximum wait,
    // regardless of load state.
    useEffect(() => {
        const t = setTimeout(() => setLocked(false), 30000);
        return () => clearTimeout(t);
    }, []);

    // Load watchdog: if the world never becomes interactive within a budget (a
    // weak GPU grinding through decode/upload, or a partial stall), bail to the
    // static backdrop. Unmounting the canvas frees its GPU/heap memory and
    // unblocks the page. Capable devices reach `perfArmed` in ~1–2s, so this only
    // fires for devices that are effectively failing.
    useEffect(() => {
        if (!webgl || perfArmed) return;
        const t = setTimeout(() => handlePerfFallback(), 12000);
        return () => clearTimeout(t);
    }, [webgl, perfArmed, handlePerfFallback]);

    const { scrollYProgress } = useScroll({ target: containerRef });
    const smooth = useSpring(scrollYProgress, {
        stiffness: 90,
        damping: 26,
        restDelta: 0.001,
    });

    // Pause the render loop once the hero scrolls out of view to save GPU.
    const isInView = useInView(containerRef, { margin: "0px 0px 500px 0px" });

    // Blend into the page: the black backdrop and the splat canvas fade out over
    // the final stretch of scroll, revealing the shared fixed SiteBackground that
    // the page content also sits on — so the two scenes become one continuous
    // background instead of meeting at a hard seam.
    const blackoutOpacity = useTransform(smooth, [0.95, 0.99], [1, 0]);
    const canvasOpacity = useTransform(smooth, [0.95, 0.99], [1, 0]);

    // Chromatic "blend" on exit (igloo.inc-style): as the black backdrop dissolves
    // into the page background, its RGB channels split apart (+ a frost blur) via
    // an SVG filter. The aberration ramps up then back down across the blend so it
    // peaks mid-transition and the final page bg is clean. The blend completes by
    // 0.99 — before the sticky hero unpins at 1.0 — leaving a settled beat so you
    // can't scroll into the page content mid-transition. The filter is only
    // attached while active, so there's no rasterisation cost during the scene.
    const [caT, setCaT] = useState(0);
    useMotionValueEvent(smooth, "change", (v) => {
        // Triangular bump over the blend window [0.95, 0.99], peaking at 0.97.
        const t = v <= 0.95 || v >= 0.99 ? 0 : 1 - Math.abs((v - 0.97) / 0.02);
        setCaT(t);
    });
    const caActive = caT > 0.001;
    const caOffset = 26 * caT; // px of R/B channel separation
    const caBlur = 5 * caT; // px of frost blur

    const handleProgress = useCallback((e: ProgressEvent) => {
        if (e.total > 0) {
            setProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
        }
    }, []);
    const handleLoad = useCallback(() => {
        setProgress(100);
        setLoaded(true);
    }, []);
    const handleError = useCallback(() => {
        // If the splat scene fails, drop the loader and reveal the static backdrop.
        setLoaded(true);
        setWebgl(false);
    }, []);

    // Safety net: never trap the visitor behind the loader if load events stall.
    useEffect(() => {
        const t = setTimeout(() => setLoaded(true), 20000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div ref={containerRef} className="relative h-[620vh] w-full">
            {/* Chromatic-aberration filter (RGB split + frost) for the exit blend */}
            <svg aria-hidden="true" className="absolute w-0 h-0" focusable="false">
                <defs>
                    <filter
                        id="hero-chroma"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                        colorInterpolationFilters="sRGB"
                    >
                        {/* Isolate the red channel and shift it left */}
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            result="r"
                            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                        />
                        <feOffset in="r" dx={-caOffset} dy="0" result="ro" />
                        {/* Green channel stays put */}
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            result="g"
                            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                        />
                        {/* Isolate the blue channel and shift it right */}
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            result="b"
                            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                        />
                        <feOffset in="b" dx={caOffset} dy="0" result="bo" />
                        {/* Recombine the channels additively, then frost */}
                        <feBlend in="ro" in2="g" mode="screen" result="rg" />
                        <feBlend in="rg" in2="bo" mode="screen" result="rgb" />
                        <feGaussianBlur in="rgb" stdDeviation={caBlur} />
                    </filter>
                </defs>
            </svg>
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                {/* Black backdrop — behind the canvas during the scene, faded out at
            the end to reveal the shared SiteBackground beneath. The chromatic-
            aberration filter rides this layer so the black→page-bg blend (not the
            scene itself) splits into RGB fringes as it dissolves. */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        opacity: blackoutOpacity,
                        filter: caActive ? "url(#hero-chroma)" : undefined,
                        background:
                            "radial-gradient(120% 120% at 50% 20%, #0a0a12 0%, #050507 55%, #000000 100%)",
                    }}
                />

                {/* Splat world canvas */}
                {webgl && (
                    <motion.div className="absolute inset-0" style={{ opacity: canvasOpacity }}>
                        <WorldErrorBoundary onError={handleError}>
                            <Canvas
                                frameloop={isInView ? "always" : "demand"}
                                dpr={initialDpr}
                                camera={{ position: [0, CAM_BASE_Y, CAM_START_Z], fov: 68 }}
                                flat
                                gl={{
                                    antialias: false,
                                    alpha: true,
                                    powerPreference: "high-performance",
                                }}
                            >
                                {world && (
                                    <SplatWorld
                                        url={world.url}
                                        paged={world.paged}
                                        liveReveal={liveReveal}
                                        smooth={smooth}
                                        onProgress={handleProgress}
                                        onLoad={handleLoad}
                                        onIntroComplete={handleIntroComplete}
                                    />
                                )}
                                <PerfGuard armed={perfArmed} onFallback={handlePerfFallback} />
                            </Canvas>
                        </WorldErrorBoundary>
                    </motion.div>
                )}

                {/* Text beats */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {BEATS.map((beat, i) => (
                        <TextBeat key={i} beat={beat} smooth={smooth} />
                    ))}
                </div>

                {/* Scroll prompt */}
                <ScrollPrompt scrollYProgress={smooth} />

                {/* Loading overlay */}
                {webgl && !loaded && <LoadingOverlay progress={progress} />}
            </div>
        </div>
    );
}
