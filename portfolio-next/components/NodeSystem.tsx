"use client";

import { useRef, useMemo, useState, useEffect, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, Trail, Float, Points, PointMaterial, Html, Clouds, Cloud } from "@react-three/drei";
import { FaDocker, FaAws } from "react-icons/fa";
import { SiDotnet, SiKubernetes, SiIntel } from "react-icons/si";
import { VscAzure } from "react-icons/vsc";
import * as THREE from "three";
import { useScroll, useSpring, useTransform, motion, useInView } from "framer-motion";

function IconAveva({ className = "w-5 h-5", ...props }: any) {
    return (
        <svg className={className} viewBox="0 0 150 40" fill="currentColor" {...props}>
            <title>AVEVA</title>
            <path d="M22 6 L10 34 H16 L18.5 28 H30.5 L33 34 H39 L27 6 H22 Z M20 23 L24.5 12 L29 23 H20 Z" />
            <rect x="0" y="24" width="18" height="4" />
            <path d="M40 6 L51 34 h6 L68 6 H61.5 L54 26 L46.5 6 Z" />
            <rect x="71" y="6" width="18" height="5" />
            <rect x="71" y="17.5" width="18" height="5" />
            <rect x="71" y="29" width="18" height="5" />
            <path d="M92 6 L103 34 h6 L120 6 H113.5 L106 26 L98.5 6 Z" />
            <path d="M128 6 L116 34 H122 L124.5 28 H136.5 L139 34 H145 L133 6 H128 Z M126 23 L130.5 12 L135 23 H126 Z" />
        </svg>
    );
}

const AnimationContext = createContext({ flyIn: { current: 0 }, explode: { current: 0 } });

// --- Node Component (Master or Worker) ---
function SystemNode({
    position,
    color,
    size,
    isMaster = false,
}: {
    position: [number, number, number];
    color: string;
    size: number;
    isMaster?: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const { flyIn, explode } = useContext(AnimationContext);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x += 0.01;
        meshRef.current.rotation.y += 0.01;

        // Gentle breathing effect for master node
        if (isMaster) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            meshRef.current.scale.setScalar(scale * Math.max(0.001, flyIn.current));
        } else {
            meshRef.current.scale.setScalar(Math.max(0.001, flyIn.current));
        }

        // Fly in & Explode position adjustments
        const introY = (1 - flyIn.current) * 15;
        const explodeY = -explode.current * 12;
        meshRef.current.position.y = position[1] + introY + explodeY;
        meshRef.current.position.x = position[0] * (1 + explode.current * 2);
        meshRef.current.position.z = position[2] * (1 + explode.current * 2);
    });

    const initialY = position[1] + 15;

    return (
        <Float speed={isMaster ? 2 : 4} rotationIntensity={isMaster ? 0 : 0.5} floatIntensity={isMaster ? 0.5 : 2}>
            <mesh
                ref={meshRef}
                position={[position[0], initialY, position[2]]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <icosahedronGeometry args={[size, 0]} />
                <meshStandardMaterial
                    color={hovered ? "#ffffff" : color}
                    wireframe={isMaster}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.8 : 0.4}
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
}

// --- Orbiting Worker Node with Trail ---
function OrbitingNode({ radius, speed, angleOffset, color, size, yOffset = 0, Icon }: { radius: number, speed: number, angleOffset: number, color: string, size: number, yOffset?: number, Icon?: any }) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const { flyIn, explode } = useContext(AnimationContext);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed + angleOffset;

        // Radius starts wide to fly in, then spreads out globally on explode
        const currentRadius = radius + (1 - flyIn.current) * 12 + explode.current * 8;

        groupRef.current.position.x = Math.cos(t) * currentRadius;
        groupRef.current.position.z = Math.sin(t) * currentRadius;

        const introY = (1 - flyIn.current) * 20;
        const explodeY = -explode.current * 15;
        groupRef.current.position.y = yOffset + Math.sin(t * 2) * 0.5 + introY + explodeY;

        if (meshRef.current) {
            meshRef.current.scale.setScalar(Math.max(0.001, flyIn.current));
        }
    });

    const initialRadius = radius + 12;
    const initialX = Math.cos(angleOffset) * initialRadius;
    const initialZ = Math.sin(angleOffset) * initialRadius;
    const initialY = yOffset + 20;

    return (
        <group ref={groupRef} position={[initialX, initialY, initialZ]}>
            <Trail
                width={size * 2} // Width of the line
                color={color} // Color of the line
                length={8} // Length of the line
                decay={1} // How fast the line fades away
                local={false} // Wether to use the target's world or local positions
                stride={0} // Min distance between previous and current point
                interval={1} // Number of frames to wait before next calculation
                target={meshRef as any} // Optional target. This object will produce the trail.
                attenuation={(t) => t * t} // A function to define the width in each point along it.
            >
                <mesh ref={meshRef}>
                    <sphereGeometry args={[size * 0.8, 16, 16]} />
                    <meshBasicMaterial visible={false} />
                    {Icon && (
                        <Html transform sprite position={[0, 0, 0]}>
                            <div
                                className="flex items-center justify-center rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-lg"
                                style={{ width: size * 100, height: size * 100, color }}
                            >
                                <Icon size={size * 54} />
                            </div>
                        </Html>
                    )}
                </mesh>
            </Trail>
        </group>
    );
}

// --- Connections (Lines between nodes) ---
function Connections({ numNodes, radius }: { numNodes: number, radius: number }) {
    const linesRef = useRef<THREE.LineSegments>(null);
    const materialRef = useRef<THREE.LineBasicMaterial>(null);
    const { flyIn, explode } = useContext(AnimationContext);

    useFrame((state) => {
        if (!linesRef.current || !materialRef.current) return;
        linesRef.current.rotation.y = state.clock.elapsedTime * 0.1;

        const s = Math.max(0.001, flyIn.current + explode.current * 1.5);
        linesRef.current.scale.set(s, Math.max(0.001, flyIn.current), s);

        linesRef.current.position.y = (1 - flyIn.current) * 15 - explode.current * 15;
        materialRef.current.opacity = flyIn.current * 0.15 * Math.max(0, 1 - explode.current * 0.5);
    });

    const geometry = useMemo(() => {
        const points = [];
        // Add center point
        points.push(new THREE.Vector3(0, 0, 0));

        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2;
            const x = Math.cos(angle) * (radius * 1.5); // Outer ring for connections
            const z = Math.sin(angle) * (radius * 1.5);
            const y = (Math.random() - 0.5) * 4;
            points.push(new THREE.Vector3(x, y, z));

            // Connect to center
            points.push(new THREE.Vector3(0, 0, 0));
            points.push(new THREE.Vector3(x, y, z));

            // Connect to random neighbor
            if (i > 0) {
                const prevAngle = ((i - 1) / numNodes) * Math.PI * 2;
                points.push(new THREE.Vector3(x, y, z));
                points.push(new THREE.Vector3(Math.cos(prevAngle) * (radius * 1.5), (Math.random() - 0.5) * 4, Math.sin(prevAngle) * (radius * 1.5)));
            }
        }
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [numNodes, radius]);

    return (
        <lineSegments ref={linesRef} geometry={geometry} position={[0, 15, 0]}>
            <lineBasicMaterial ref={materialRef} color="#4f4f4f" transparent opacity={0.15} />
        </lineSegments>
    );
}


// --- Floating Network Particles ---
function NetworkDataParticles({ count = 2000 }) {
    const pointsRef = useRef<THREE.Points>(null);
    const { flyIn, explode } = useContext(AnimationContext);

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const distance = 12;
        for (let i = 0; i < count; i++) {
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);

            let x = distance * Math.sin(theta) * Math.cos(phi);
            let y = distance * Math.sin(theta) * Math.sin(phi);
            let z = distance * Math.cos(theta);

            positions.set([x, y, z], i * 3);
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        pointsRef.current.rotation.z = state.clock.elapsedTime * 0.02;

        const s = Math.max(0.001, flyIn.current + explode.current * 2);
        pointsRef.current.scale.set(s, s, s);
        pointsRef.current.position.y = (1 - flyIn.current) * 20 - explode.current * 15;
    });

    return (
        <Points ref={pointsRef} positions={particlesPosition} stride={3} frustumCulled={false} position={[0, 20, 0]}>
            <PointMaterial transparent color="#a8a8a8" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
        </Points>
    );
}

// --- Animated Volumetric Clouds ---
function AnimatedClouds() {
    const cloudsRef = useRef<THREE.Group>(null);
    const { flyIn, explode } = useContext(AnimationContext);

    useFrame((state) => {
        if (!cloudsRef.current) return;
        cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
        cloudsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;

        // Fly in
        const s = Math.max(0.001, flyIn.current + explode.current * 0.5);
        cloudsRef.current.scale.set(s, s, s);
        cloudsRef.current.position.y = (1 - flyIn.current) * -20 - explode.current * 5;
    });

    return (
        <group ref={cloudsRef}>
            {/* Using MeshBasicMaterial prevents any shadows from rendering them dark */}
            <Clouds material={THREE.MeshBasicMaterial} limit={150}>
                {/* Optimized clouds: lower segment counts and volumes to drastically reduce GPU overdraw */}
                <Cloud seed={1} bounds={[15, 6, 15]} color="#ffffff" volume={4} position={[-8, 4, -12]} speed={0.1} opacity={0.65} segments={15} />
                <Cloud seed={2} bounds={[20, 8, 20]} color="#bae6fd" volume={5} position={[6, -4, -15]} speed={0.15} opacity={0.35} segments={15} />
                <Cloud seed={3} bounds={[20, 6, 20]} color="#7dd3fc" volume={4} position={[-2, -6, -10]} speed={0.12} opacity={0.25} segments={12} />
                <Cloud seed={4} bounds={[25, 10, 25]} color="#ffffff" volume={6} position={[8, 5, -18]} speed={0.08} opacity={0.7} segments={20} />
                <Cloud seed={5} bounds={[15, 8, 15]} color="#e0f2fe" volume={3} position={[0, 8, -14]} speed={0.2} opacity={0.4} segments={10} />
            </Clouds>
        </group>
    );
}

// --- Scene Setup and Scroll Controls ---
function SceneContainer({ scrollYProgress, isLoaded }: { scrollYProgress: any, isLoaded: boolean }) {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const flyInRef = useRef(0);
    const explodeRef = useRef(0);

    // Scroll-based animations
    useFrame((state, delta) => {
        if (isLoaded) {
            flyInRef.current = THREE.MathUtils.damp(flyInRef.current, 1, 3, delta);
        }

        const progress = scrollYProgress.get();
        if (progress > 0.75) {
            const factor = (progress - 0.75) / 0.25; // 0 to 1
            explodeRef.current = Math.pow(factor, 3) * 8; // exponential burst
        } else {
            explodeRef.current = 0;
        }

        if (!groupRef.current) return;
        groupRef.current.rotation.y = progress * Math.PI * 2;
        groupRef.current.rotation.x = progress * Math.PI * 0.5;

        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10 - (progress * 4), 0.1);
    });

    return (
        <AnimationContext.Provider value={{ flyIn: flyInRef, explode: explodeRef }}>
            <group ref={groupRef}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4338ca" />

                {/* Master Node */}
                <SystemNode position={[0, 0, 0]} color="#1a1a1a" size={1.5} isMaster />

                {/* Inner Orbit (e.g., Services) */}
                <OrbitingNode radius={3} speed={0.5} angleOffset={0} color="#0db7ed" size={0.35} yOffset={1} Icon={FaDocker} />
                <OrbitingNode radius={3} speed={0.5} angleOffset={Math.PI} color="#512bd4" size={0.35} yOffset={-1} Icon={SiDotnet} />

                {/* Outer Orbit (e.g., Worker Nodes/Containers) */}
                <OrbitingNode radius={6} speed={0.2} angleOffset={0} color="#ff9900" size={0.4} Icon={FaAws} />
                <OrbitingNode radius={6} speed={0.2} angleOffset={Math.PI * 0.4} color="#0089d6" size={0.45} yOffset={2} Icon={VscAzure} />
                <OrbitingNode radius={6} speed={0.2} angleOffset={Math.PI * 0.8} color="#326ce5" size={0.45} yOffset={-1.5} Icon={SiKubernetes} />
                <OrbitingNode radius={6} speed={0.2} angleOffset={Math.PI * 1.2} color="#0071c5" size={0.4} yOffset={1} Icon={SiIntel} />
                <OrbitingNode radius={6} speed={0.2} angleOffset={Math.PI * 1.6} color="#7c3aed" size={0.4} yOffset={-1} Icon={IconAveva} />

                {/* Network Connections */}
                <Connections numNodes={12} radius={4} />

                {/* Data Flow Particles */}
                <NetworkDataParticles />

                {/* Animated Background Clouds */}
                <AnimatedClouds />
            </group>
        </AnimationContext.Provider>
    );
}


/* ─────────────────────────────────────────────────────────────────
   TEXT BEATS
───────────────────────────────────────────────────────────────── */
const BEATS = [
    { from: 0.0, to: 0.15, text: "Sahil's Portfolio", sub: "Distributed Systems.", align: "center" as const },
    { from: 0.25, to: 0.45, text: "Scaling Complexity.", sub: "Built for Resilience.", align: "left" as const },
    { from: 0.55, to: 0.75, text: "Connected Engineering.", sub: "Nodes in Harmony.", align: "right" as const },
    { from: 0.85, to: 1.0, text: "System Ready.", sub: "Scroll to explore.", align: "center" as const },
];

function TextBeat({ beat, scrollYProgress }: { beat: (typeof BEATS)[number]; scrollYProgress: any }) {
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
        center: "left-1/2 -translate-x-1/2 text-center items-center pointer-events-none select-none",
        left: "left-5 md:left-16 lg:left-28 text-left items-start pointer-events-none select-none",
        right: "right-5 md:right-16 lg:right-28 text-right items-end pointer-events-none select-none",
    }[beat.align];

    return (
        <motion.div
            style={{ opacity, y, zIndex: 10 }}
            className={`absolute bottom-[20%] md:bottom-[15%] flex flex-col gap-2 md:gap-3 ${alignClass}`}
        >
            <span className="text-[clamp(1.5rem,6vw,5rem)] font-black tracking-[-0.04em] text-black/85 leading-none drop-shadow-lg">
                {beat.text}
            </span>
            <span className="text-[clamp(0.65rem,2.5vw,1.1rem)] font-light tracking-[0.12em] md:tracking-[0.18em] uppercase text-black/50 drop-shadow-md">
                {beat.sub}
            </span>
        </motion.div>
    );
}

// --- Main Container ---
export default function NodeSystem() {
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingDivRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressTextRef = useRef<HTMLSpanElement>(null);
    const [sceneReady, setSceneReady] = useState(false);

    useEffect(() => {
        let pct = 0;
        const interval = setInterval(() => {
            pct += Math.random() * 15;
            if (pct >= 100) {
                pct = 100;
                clearInterval(interval);
                const el = loadingDivRef.current;
                if (el) {
                    el.style.transition = "opacity 0.6s ease";
                    el.style.opacity = "0";
                    setSceneReady(true);
                    setTimeout(() => {
                        if (el) el.style.display = "none";
                    }, 500);
                }
            }
            if (progressBarRef.current) progressBarRef.current.style.width = `${Math.round(pct)}%`;
            if (progressTextRef.current) progressTextRef.current.textContent = `${Math.round(pct)}%`;
        }, 80);
        return () => clearInterval(interval);
    }, []);
    const { scrollYProgress } = useScroll({ target: containerRef });
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 20,
        restDelta: 0.001,
    });

    // Stop rendering the 3D scene when it scrolls completely out of view to save major compute
    const isInView = useInView(containerRef, { margin: "0px 0px 500px 0px" });

    // Fade out canvas slightly at end of scroll
    const opacity = useTransform(smoothProgress, [0.8, 1], [1, 0.4]);

    // Animate background color from a slight blue tint to the original light background
    const bgColor = useTransform(smoothProgress, [0, 0.8], ["#e0f2fe", "#f8f9fa"]);

    return (
        <div ref={containerRef} className="relative h-[300vh] w-full bg-[#f2f2f2]" style={{ zIndex: 0 }}>
            <motion.div className="sticky top-0 h-screen w-full overflow-hidden" style={{ opacity, backgroundColor: bgColor }}>

                {/* Three.js Canvas */}
                <div className="absolute inset-0 w-full h-full pointer-events-auto">
                    <Canvas
                        frameloop={isInView ? "always" : "demand"}
                        camera={{ position: [0, 0, 12], fov: 45 }}
                        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
                    >
                        {/* Removed static <color attach="background" /> to allow the motion.div's animated background to show through */}
                        <SceneContainer scrollYProgress={smoothProgress} isLoaded={sceneReady} />
                    </Canvas>
                </div>

                {/* Text Overlays */}
                <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                    {BEATS.map((beat, i) => (
                        <TextBeat key={i} beat={beat} scrollYProgress={smoothProgress} />
                    ))}
                </div>

                {/* Subtle vignette/fog gradient on bottom to blend into page */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#f5f5f7] to-transparent z-20 pointer-events-none" />

                {/* Loading overlay */}
                <div
                    ref={loadingDivRef}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5"
                    style={{ backgroundColor: "#e0f2fe" }}
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

            </motion.div>
        </div>
    );
}