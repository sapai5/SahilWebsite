"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { type MotionValue } from "framer-motion";
import * as THREE from "three";

const MODEL = "/models/classic_laptop/classic_laptop_1k.gltf";
const SCREEN_MATERIAL = "classic_laptop_screen";

// useGLTF caches the scene across mounts; track which scenes we've already
// normalized so revisiting the page doesn't re-apply the absolute scale.
const normalizedScenes = new WeakSet<THREE.Object3D>();

// Screen text orientation toggles — flip just one of these if it reads mirrored.
const FLIP_U = false;
const FLIP_V = true;

// Grunge AWS sticker on the lid back (tune if it floats / sinks / is too big).
const LOGO_SCALE = 0.5; // sticker size relative to screen width
const LOGO_OFFSET = 0.06; // distance behind the lid, as a fraction of screen width
const AWS_PATH =
  "M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.15-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z";

/** Default screen content — a hacker terminal. Edit these lines to taste. */
const CMD = "#39ff14";
const OUT = "#9bedb0";
const ACC = "#5cff9e";
const DIM = "#2f7d4e";
const DEFAULT_LINES: { text: string; color: string }[] = [
  { text: "$ ssh sahilpai@portland", color: CMD },
  { text: "Last login: just now", color: DIM },
  { text: "$ whoami", color: CMD },
  { text: "sahil a. pai // software engineer", color: OUT },
  { text: "$ sudo cat /etc/about", color: CMD },
  { text: "> SDE intern @ AWS Elemental", color: ACC },
  { text: "> founder, TerraMind (#1 global)", color: ACC },
  { text: "> 4x hackathon champ // CS @ ASU", color: ACC },
  { text: "$ ./hire-me _", color: CMD },
];

function makeScreenTexture(lines: typeof DEFAULT_LINES) {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1280;
  const ctx = c.getContext("2d")!;
  // near-black CRT background with a faint green tint
  ctx.fillStyle = "#04100a";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = "700 76px 'Courier New', ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const padX = 128;
  let y = 96;
  for (const line of lines) {
    // soft phosphor glow underlay…
    ctx.shadowColor = line.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, padX, y);
    // …then a crisp pass on top so it stays sharp/readable
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#d6ffe4";
    ctx.fillText(line.text, padX, y);
    ctx.fillStyle = line.color;
    ctx.globalAlpha = 0.85;
    ctx.fillText(line.text, padX, y);
    ctx.globalAlpha = 1;
    y += 124;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false; // match glTF UV convention
  tex.anisotropy = 16;
  return tex;
}

function makeGrungeAwsTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  // Draw the AWS logo (its real vector path), worn off-white like an old decal.
  const s = (512 / 24) * 0.82;
  const off = (512 - 24 * s) / 2;
  ctx.save();
  ctx.translate(off, off);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(35, 47, 62, 0.92)"; // AWS "Squid Ink" dark blue
  ctx.fill(new Path2D(AWS_PATH));
  ctx.restore();
  // Grunge: erode the logo with scattered specks + scratches so it looks worn.
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 900; i++) {
    ctx.globalAlpha = Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 5 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 30; i++) {
    ctx.globalAlpha = Math.random() * 0.4;
    ctx.lineWidth = Math.random() * 2.2;
    ctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function Spinner({
  children,
  screenNormalRef,
  progress,
  slow = 0.4,
  fast = 2.6,
}: {
  children: React.ReactNode;
  screenNormalRef: React.RefObject<THREE.Vector3>;
  progress?: MotionValue<number>;
  slow?: number;
  fast?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const wq = useMemo(() => new THREE.Quaternion(), []);
  const wn = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;

    // Scroll-driven entrance: starts up high (around mid-screen) and comes
    // down into its resting position in the card.
    const p = progress ? progress.get() : 1;
    const ease = p * p * (3 - 2 * p);
    g.position.y = THREE.MathUtils.lerp(1.0, 0, ease);
    g.scale.setScalar(THREE.MathUtils.lerp(1.12, 1, ease));

    // Spin: slow while the screen faces the camera, faster through the back.
    g.getWorldQuaternion(wq);
    wn.copy(screenNormalRef.current).applyQuaternion(wq).normalize();
    camDir.copy(camera.position).normalize();
    const facing = THREE.MathUtils.clamp(wn.dot(camDir), -1, 1);
    let t = (1 - facing) / 2;
    t = t * t * (3 - 2 * t);
    g.rotation.y += dt * (slow + (fast - slow) * t);
  });
  return <group ref={ref}>{children}</group>;
}

function Laptop({ lines, screenNormalRef }: { lines: typeof DEFAULT_LINES; screenNormalRef: React.RefObject<THREE.Vector3> }) {
  const { scene } = useGLTF(MODEL);
  const texture = useMemo(() => makeScreenTexture(lines), [lines]);
  const sticker = useMemo(() => makeGrungeAwsTexture(), []);

  // Normalize the model to a known size + centre it once, so a fixed camera
  // frames it (no Bounds) and the fly-in transform is predictable. useGLTF
  // caches the scene across mounts, so guard against re-applying the scale
  // (which would shrink it on every revisit).
  useLayoutEffect(() => {
    if (normalizedScenes.has(scene)) return;
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    scene.scale.setScalar(1.8 / maxDim);
    scene.updateMatrixWorld(true);
    const c = new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3());
    scene.position.sub(c);
    normalizedScenes.add(scene);
  }, [scene]);

  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || mat.name !== SCREEN_MATERIAL) return;

      // The screen quad's own UVs don't cleanly map our canvas, and the base
      // colour is near-black. Re-project planar UVs from the face normal so the
      // texture covers the whole screen, then show it through the emissive
      // channel so it reads like a lit display regardless of lighting.
      const geo = mesh.geometry as THREE.BufferGeometry;
      const pos = geo.attributes.position;
      const nor = geo.attributes.normal;
      if (pos && nor) {
        const n = new THREE.Vector3();
        const tmp = new THREE.Vector3();
        for (let i = 0; i < nor.count; i++) {
          n.add(tmp.set(nor.getX(i), nor.getY(i), nor.getZ(i)));
        }
        n.normalize();
        screenNormalRef.current.copy(n);
        const up = Math.abs(n.y) < 0.95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const t = new THREE.Vector3().crossVectors(up, n).normalize();
        const b = new THREE.Vector3().crossVectors(n, t).normalize();

        const us: number[] = [];
        const vs: number[] = [];
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
        const p = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
          const u = p.dot(t);
          const v = p.dot(b);
          us.push(u); vs.push(v);
          if (u < minU) minU = u; if (u > maxU) maxU = u;
          if (v < minV) minV = v; if (v > maxV) maxV = v;
        }
        const ru = maxU - minU || 1;
        const rv = maxV - minV || 1;
        const uv = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
          // Screen text orientation. If it's still wrong, toggle these two:
          const fu = (us[i] - minU) / ru;
          const fv = (vs[i] - minV) / rv;
          uv[i * 2] = FLIP_U ? 1 - fu : fu;
          uv[i * 2 + 1] = FLIP_V ? 1 - fv : fv;
        }
        geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

        // Worn AWS sticker on the lid back (parallel to the screen, opposite side).
        geo.computeBoundingBox();
        const center = geo.boundingBox!.getCenter(new THREE.Vector3());
        const screenW = Math.max(ru, rv);
        const existing = mesh.getObjectByName("aws-sticker");
        if (existing) existing.removeFromParent();
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(screenW * LOGO_SCALE, screenW * LOGO_SCALE),
          new THREE.MeshBasicMaterial({ map: sticker, transparent: true, depthWrite: false }),
        );
        plane.name = "aws-sticker";
        const nNeg = n.clone().multiplyScalar(-1);
        plane.position.copy(center).addScaledVector(nNeg, screenW * LOGO_OFFSET);
        plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nNeg);
        mesh.add(plane);
      }

      mat.map = texture;
      mat.color = new THREE.Color("#ffffff");
      mat.emissiveMap = texture;
      mat.emissive = new THREE.Color("#ffffff");
      mat.emissiveIntensity = 1.2;
      mat.roughness = 0.4;
      mat.needsUpdate = true;
    });
  }, [scene, texture, sticker, screenNormalRef]);

  return <primitive object={scene} />;
}
useGLTF.preload(MODEL);

export default function LaptopModel({ lines = DEFAULT_LINES, progress }: { lines?: typeof DEFAULT_LINES; progress?: MotionValue<number> }) {
  const screenNormalRef = useRef(new THREE.Vector3(0, 0, 1));
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="always"
      camera={{ fov: 40, position: [2.0, 1.2, 2.6] }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} />
      <directionalLight position={[-4, 2, -3]} intensity={0.55} color="#bcd4ff" />
      <Suspense fallback={null}>
        <Spinner screenNormalRef={screenNormalRef} progress={progress}>
          <Laptop lines={lines} screenNormalRef={screenNormalRef} />
        </Spinner>
      </Suspense>
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 3.3}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
