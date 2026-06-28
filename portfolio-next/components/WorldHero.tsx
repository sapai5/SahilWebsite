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
   Point this at a World Labs Marble world (3D Gaussian splats, .spz).

   To use your own generated world:
     1. Run `npm run generate:world` (see scripts/generate-world.mjs) to
        create and download a world into public/worlds/hero/.
     2. Set NEXT_PUBLIC_HERO_WORLD_URL=/worlds/hero/world.spz (e.g. in .env.local).

   Defaults to the self-hosted hero world at /worlds/hero/world.spz (committed
   in public/), so it works in production without any env configuration. Set
   NEXT_PUBLIC_HERO_WORLD_URL to override (e.g. when testing a new world).
───────────────────────────────────────────────────────────────── */
const HERO_WORLD_URL =
    process.env.NEXT_PUBLIC_HERO_WORLD_URL ||
    "/worlds/hero/world.spz";

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
const CAM_START_Z = 0.8;
const CAM_RUN_LEN = 8.0;
const CAM_BASE_Y = 0.12;
const CAM_TURN_START = 0.6;
const CAM_TURN_END = 0.82; // turn completes here; the fade-out begins after this
const CAM_TURN_DIR = 1; // +1 or -1 — direction of the 180° turn
const CAM_CURVE_X = 1.5; // lateral meander amplitude (canyon weave)
const CAM_CURVE_Y = 0.5; // vertical variance amplitude (rises / dips)

// Duration (seconds) of the "point cloud → render" intro bloom.
const REVEAL_DURATION = 2.2;
// How long the point cloud lingers (seconds) before it starts building the world.
const REVEAL_LINGER = 1.1;
// Scroll fraction at which the world dissolves back into a point cloud on exit.
const REVEAL_EXIT_START = 0.82;

/* ─────────────────────────────────────────────────────────────────
   WEBGL DETECTION
───────────────────────────────────────────────────────────────── */
function isWebGLAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const canvas = document.createElement("canvas");
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
    } catch {
        return false;
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
    smooth,
    onProgress,
    onLoad,
    onIntroComplete,
}: {
    url: string;
    smooth: MotionValue<number>;
    onProgress: (e: ProgressEvent) => void;
    onLoad: () => void;
    onIntroComplete: () => void;
}) {
    const renderer = useThree((s) => s.gl);
    const camera = useThree((s) => s.camera);
    const meshRef = useRef<SparkSplatMesh>(null);

    // Memoize constructor args so R3F doesn't rebuild the renderer/mesh each render.
    const sparkArgs = useMemo(() => ({ renderer }), [renderer]);
    // "Point cloud → render" reveal modifier + its driving uniform.
    const { reveal, modifier } = useMemo(() => makeRevealModifier(), []);
    const revealStart = useRef(-1);
    const lastReveal = useRef(-1);
    const introDone = useRef(false);
    const splatArgs = useMemo(
        () => ({ url, onProgress, onLoad, objectModifiers: [modifier] }),
        [url, onProgress, onLoad, modifier],
    );

    // First-person "running" camera, driven by scroll.
    const lookTarget = useMemo(() => new THREE.Vector3(0, CAM_BASE_Y, -1), []);
    const tinted = useRef(false);
    useFrame((state, delta) => {
        const p = smooth.get(); // 0 → 1 across the hero scroll
        const t = state.clock.elapsedTime;

        // Marble bakes fairly muted color — lift it a touch once the splats load.
        const mesh = meshRef.current as (SparkSplatMesh & { isInitialized?: boolean; recolor?: THREE.Color; generatorDirty?: boolean }) | null;
        if (mesh && !tinted.current && mesh.isInitialized && mesh.recolor) {
            mesh.recolor.setRGB(1.14, 1.1, 1.04); // subtle warm brightness lift
            tinted.current = true;
        }

        // "Point cloud" lifecycle:
        //  • intro — linger as points, then bloom into the world (time-based)
        //  • exit  — dissolve back into points as you scroll out (scroll-based)
        // The visible reveal is the minimum of the two, so the world only exists
        // in the middle. We only re-run the generator while the value is actually
        // changing, to avoid regenerating every frame when settled.
        if (mesh && mesh.isInitialized) {
            if (revealStart.current < 0) revealStart.current = t;
            const introP = THREE.MathUtils.clamp(
                (t - revealStart.current - REVEAL_LINGER) / REVEAL_DURATION,
                0,
                1,
            );
            if (introP >= 1 && !introDone.current) {
                introDone.current = true;
                onIntroComplete(); // world is built — release scroll lock
            }
            const exitP = 1 - THREE.MathUtils.smoothstep(p, REVEAL_EXIT_START, 1.0);
            const target = Math.min(introP, exitP);
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
        const a = runP * Math.PI;
        const px = Math.sin(a * 1.4) * CAM_CURVE_X + sway;
        const py = CAM_BASE_Y + Math.sin(a * 0.8) * CAM_CURVE_Y + bob;
        const pz = CAM_START_Z - runP * CAM_RUN_LEN;

        // Path tangent → the camera looks along the direction it's travelling,
        // so it reads as following the canyon instead of strafing.
        const tx = Math.cos(a * 1.4) * 1.4 * Math.PI * CAM_CURVE_X;
        const ty = Math.cos(a * 0.8) * 0.8 * Math.PI * CAM_CURVE_Y;
        const tz = -CAM_RUN_LEN;

        // Rotate the heading for the 180° turn-around toward the waterfall at the end.
        const th = CAM_TURN_DIR * turnP * Math.PI;
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
            <span className="text-[clamp(1.5rem,6vw,5rem)] font-black tracking-[-0.04em] text-black/85 leading-none drop-shadow-lg">
                {beat.text}
            </span>
            {beat.sub && (
                <span className="text-[clamp(0.65rem,2.5vw,1.1rem)] font-light tracking-[0.12em] md:tracking-[0.18em] uppercase text-black/50 drop-shadow-md">
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
    return (
        <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 transition-opacity duration-500"
            style={{ backgroundColor: "#eef1f6" }}
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
                    Generating world…
                </span>
                <div className="w-36 h-px bg-black/10 overflow-hidden rounded-full">
                    <div
                        className="h-full bg-black/25 rounded-full"
                        style={{ width: `${progress}%`, transition: "width 0.15s linear" }}
                    />
                </div>
                <span className="text-[9px] tracking-widest text-black/20 tabular-nums">
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
    // Scroll is locked while the point cloud builds the world, then released.
    // Only lock if WebGL is available (otherwise there's no reveal to wait for).
    const [locked, setLocked] = useState(() => isWebGLAvailable());
    const unlock = useCallback(() => setLocked(false), []);
    // Lazily detect WebGL on first (client-only) render — this component is
    // dynamically imported with ssr:false, so the initializer runs in the browser.
    const [webgl, setWebgl] = useState(() => isWebGLAvailable());

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

    const { scrollYProgress } = useScroll({ target: containerRef });
    const smooth = useSpring(scrollYProgress, {
        stiffness: 90,
        damping: 26,
        restDelta: 0.001,
    });

    // Pause the render loop once the hero scrolls out of view to save GPU.
    const isInView = useInView(containerRef, { margin: "0px 0px 500px 0px" });

    // No opacity fade — the world dissolves back into a point cloud on exit instead.
    const bgColor = useTransform(smooth, [0, CAM_TURN_END], ["#e9eef5", "#f5f5f7"]);

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
        <div ref={containerRef} className="relative h-[480vh] w-full">
            <motion.div
                className="sticky top-0 h-screen w-full overflow-hidden"
                style={{ backgroundColor: bgColor }}
            >
                {/* Static backdrop — always behind the canvas, and the sole visual
            if WebGL is unavailable. */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(120% 120% at 50% 20%, #f7f9fc 0%, #dfe6f1 55%, #c7d2e6 100%)",
                    }}
                />

                {/* Splat world canvas */}
                {webgl && (
                    <div className="absolute inset-0">
                        <WorldErrorBoundary onError={handleError}>
                            <Canvas
                                frameloop={isInView ? "always" : "demand"}
                                camera={{ position: [0, CAM_BASE_Y, CAM_START_Z], fov: 68 }}
                                flat
                                gl={{
                                    antialias: false,
                                    alpha: true,
                                    powerPreference: "high-performance",
                                }}
                            >
                                <SplatWorld
                                    url={HERO_WORLD_URL}
                                    smooth={smooth}
                                    onProgress={handleProgress}
                                    onLoad={handleLoad}
                                    onIntroComplete={unlock}
                                />
                            </Canvas>
                        </WorldErrorBoundary>
                    </div>
                )}

                {/* Text beats */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {BEATS.map((beat, i) => (
                        <TextBeat key={i} beat={beat} smooth={smooth} />
                    ))}
                </div>

                {/* Scroll prompt */}
                <ScrollPrompt scrollYProgress={smooth} />

                {/* Bottom vignette blends the hero into the page below */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#f5f5f7] to-transparent z-20 pointer-events-none" />

                {/* Loading overlay */}
                {webgl && !loaded && <LoadingOverlay progress={progress} />}
            </motion.div>
        </div>
    );
}
