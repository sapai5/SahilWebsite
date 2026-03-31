"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  type: "dot" | "binary" | "symbol" | "geometry";
  text?: string;
  shape?: "circle" | "triangle" | "square";
  size: number;
  rotation: number;
  vRotation: number;
  phaseX: number;
  phaseY: number;
  speed: number;
}

const BINARY_STRINGS = [
  "01100001 01110010 01101101",
  "01100101 01101110 10101010",
  "11001100 01010101 00000000",
  "11111111 10101010 01010101",
  "00110011 11001100 01100110",
];
const SYMBOLS = ["</>", "{ }", "[ ]", "()", ";", "=>", "&&", "||", "++", "==="];
const SHAPES = ["circle", "triangle", "square"] as const;

export default function FloatingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Config
    const NUM_PARTICLES = 55;
    const CONNECTION_DISTANCE = 250;
    const MIN_CONNECTION_DISTANCE = 70;
    const FORCE_RADIUS = 150;
    const FORCE_MAGNITUDE = 0.35;
    const MAX_SPEED = 2.5;
    const DAMPING = 0.985;
    const SPRING_K = 0.0022;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      const { innerWidth, innerHeight } = window;
      const cols = Math.ceil(Math.sqrt(NUM_PARTICLES * (innerWidth / innerHeight)));
      const rows = Math.ceil(NUM_PARTICLES / cols);
      const cellW = innerWidth / cols;
      const cellH = innerHeight / rows;

      let count = 0;
      let binaryCount = 0;
      outer: for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (count >= NUM_PARTICLES) break outer;
          count++;
          const px = (col + 0.1 + Math.random() * 0.8) * cellW;
          const py = (row + 0.1 + Math.random() * 0.8) * cellH;
          const typeRoll = Math.random();
          let type: Particle["type"] = "dot";
          let text: string | undefined;
          let shape: Particle["shape"] | undefined;
          let size = 1;

          if (typeRoll < 0.35) {
            type = "dot";
            size = Math.random() * 2 + 1;
          } else if (binaryCount < 3 && typeRoll < 0.42) {
            type = "binary";
            text = BINARY_STRINGS[Math.floor(Math.random() * BINARY_STRINGS.length)];
            size = Math.random() * 12 + 12;
            binaryCount++;
          } else if (typeRoll < 0.72) {
            type = "symbol";
            text = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            size = Math.random() * 14 + 14;
          } else {
            type = "geometry";
            shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            size = Math.random() * 45 + 15;
          }

          const vx = (Math.random() - 0.5) * 0.5;
          const vy = (Math.random() - 0.5) * 0.5;

          particles.push({
            x: px, y: py, homeX: px, homeY: py,
            vx, vy, baseVx: vx, baseVy: vy,
            type, text, shape, size,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.005,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            speed: 0.015 + Math.random() * 0.025,
          });
        }
      }
    };

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      if (window.scrollY > window.innerHeight * 20) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { width, height } = canvas;
      const mouse = mouseRef.current;
      const time = Date.now() * 0.001;

      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const mouseDist = Math.sqrt(distSq);

        // Passive float: two harmonics give an organic, non-repeating figure-8 feel.
        // Scale back when the mouse is nearby so repulsion stays crisp.
        const mouseInfluence = Math.max(0, 1 - mouseDist / (FORCE_RADIUS * 2));
        const passiveScale = 1 - mouseInfluence * 0.6; // 1.0 far away → 0.4 near mouse
        const floatX =
          Math.sin(time * p.speed + p.phaseX) * 1.1 +
          Math.sin(time * p.speed * 1.7 + p.phaseY) * 0.5;
        const floatY =
          Math.cos(time * p.speed + p.phaseY) * 1.1 +
          Math.cos(time * p.speed * 1.3 + p.phaseX) * 0.5;
        p.vx += floatX * passiveScale;
        p.vy += floatY * passiveScale;

        if (distSq < FORCE_RADIUS * FORCE_RADIUS && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / FORCE_RADIUS) * FORCE_MAGNITUDE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRotation;

        // Restore natural drift + constant pull to home
        p.vx += (p.homeX - p.x) * SPRING_K;
        p.vy += (p.homeY - p.y) * SPRING_K;

        // Velocity restoration
        p.vx += (p.baseVx - p.vx) * 0.03;
        p.vy += (p.baseVy - p.vy) * 0.03;
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // Wrap
        const pad = 100;
        if (p.x < -pad) { p.x = width + pad; p.homeX = width + pad; }
        if (p.x > width + pad) { p.x = -pad; p.homeX = -pad; }
        if (p.y < -pad) { p.y = height + pad; p.homeY = height + pad; }
        if (p.y > height + pad) { p.y = -pad; p.homeY = -pad; }
      }

      // Connections
      const connectable = particles.filter(p => p.type === "dot" || p.type === "geometry");
      for (let i = 0; i < connectable.length; i++) {
        for (let j = i + 1; j < connectable.length; j++) {
          const dx = connectable[i].x - connectable[j].x;
          const dy = connectable[i].y - connectable[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE && distSq > MIN_CONNECTION_DISTANCE * MIN_CONNECTION_DISTANCE) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            const opacity = 0.35 * (1 - (dist - MIN_CONNECTION_DISTANCE) / (CONNECTION_DISTANCE - MIN_CONNECTION_DISTANCE));
            ctx.strokeStyle = `rgba(0, 0, 0, ${Math.max(0, opacity)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(connectable[i].x, connectable[i].y);
            ctx.lineTo(connectable[j].x, connectable[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = "rgba(0, 0, 0, 0.06)";

        if (p.type === "dot") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "binary" || p.type === "symbol") {
          ctx.font = `300 ${p.size}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.text || "", 0, 0);
        } else if (p.type === "geometry") {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (p.shape === "circle") ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          else if (p.shape === "square") ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
          else if (p.shape === "triangle") {
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.86, p.size * 0.5);
            ctx.lineTo(-p.size * 0.86, p.size * 0.5);
            ctx.closePath();
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    resizeCanvas();
    initParticles();
    draw();

    window.addEventListener("resize", resizeCanvas);
    const handleMM = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", handleMM);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMM);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
      style={{
        maskImage: "radial-gradient(circle at center, black 0%, transparent 95%)",
        WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 95%)",
      }}
    />
  );
}