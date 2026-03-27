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
    const NUM_PARTICLES = 49;
    const CONNECTION_DISTANCE = 250;
    const MIN_CONNECTION_DISTANCE = 80; // net effect — no lines between very close particles
    const FORCE_RADIUS = 100;
    const FORCE_MAGNITUDE = 0.2;    // gentle push over large area
    const MAX_SPEED = 3;
    const DAMPING = 0.993;           // very smooth deceleration
    const SPRING_K = 0.000675;     // ~3.3 second return period at 60fps

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      const { innerWidth, innerHeight } = window;

      // Stratified grid for even distribution
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

          // Place with jitter within cell
          const px = (col + 0.2 + Math.random() * 0.6) * cellW;
          const py = (row + 0.2 + Math.random() * 0.6) * cellH;

          const typeRoll = Math.random();
          let type: Particle["type"] = "dot";
          let text: string | undefined;
          let shape: Particle["shape"] | undefined;
          let size = 1;

          if (typeRoll < 0.58) {
            type = "dot";
            size = Math.random() * 1.5 + 0.5;
          } else if (binaryCount < 3 && typeRoll < 0.67) {
            type = "binary";
            text = BINARY_STRINGS[Math.floor(Math.random() * BINARY_STRINGS.length)];
            size = Math.random() * 12 + 12;
            binaryCount++;
          } else if (typeRoll < 0.80) {
            type = "symbol";
            text = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            size = Math.random() * 14 + 14;
          } else {
            type = "geometry";
            shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            size = Math.random() * 60 + 30;
          }

          const vx = (Math.random() - 0.5) * 0.7;
          const vy = (Math.random() - 0.5) * 0.7;

          particles.push({
            x: px, y: py, homeX: px, homeY: py,
            vx, vy, baseVx: vx, baseVy: vy,
            type, text, shape, size,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.004,
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 0.8;

      const { width, height } = canvas;
      const mouse = mouseRef.current;

      // Update positions
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < FORCE_RADIUS * FORCE_RADIUS && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / FORCE_RADIUS) * FORCE_MAGNITUDE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRotation;

        // If moving faster than base (i.e. was pushed), damp back to base speed
        const baseSpeed = Math.sqrt(p.baseVx * p.baseVx + p.baseVy * p.baseVy);
        if (speed > baseSpeed * 1.3) {
          p.vx *= DAMPING;
          p.vy *= DAMPING;
        } else {
          // Restore natural drift velocity
          p.vx += (p.baseVx - p.vx) * 0.02;
          p.vy += (p.baseVy - p.vy) * 0.02;
        }

        // Spring return when pushed far from home (~3s return via SPRING_K)
        const hdx = p.homeX - p.x;
        const hdy = p.homeY - p.y;
        const homeDist = Math.sqrt(hdx * hdx + hdy * hdy);
        const HOME_THRESHOLD = 180;

        if (homeDist > HOME_THRESHOLD) {
          // Progressive spring — stronger the farther away
          const t = (homeDist - HOME_THRESHOLD) / HOME_THRESHOLD;
          p.vx += (hdx / homeDist) * SPRING_K * homeDist * (1 + t);
          p.vy += (hdy / homeDist) * SPRING_K * homeDist * (1 + t);
        }

        // Wrap around edges — and update home position to match so spring doesn't fire spuriously
        const pad = 80;
        if (p.x < -pad) { p.x = width + pad; p.homeX = width + pad; }
        if (p.x > width + pad) { p.x = -pad; p.homeX = -pad; }
        if (p.y < -pad) { p.y = height + pad; p.homeY = height + pad; }
        if (p.y > height + pad) { p.y = -pad; p.homeY = -pad; }

      }

      // Draw connections for dots and geometry
      const connectable = particles.filter((p) => p.type === "dot" || p.type === "geometry");
      for (let i = 0; i < connectable.length; i++) {
        for (let j = i + 1; j < connectable.length; j++) {
          const dx = connectable[i].x - connectable[j].x;
          const dy = connectable[i].y - connectable[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > MIN_CONNECTION_DISTANCE && dist < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * (1 - dist / CONNECTION_DISTANCE)})`;
            ctx.moveTo(connectable[i].x, connectable[i].y);
            ctx.lineTo(connectable[j].x, connectable[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.type === "binary") {
          ctx.rotate(0.1); // Fixed rotation for binary strings
        } else {
          ctx.rotate(p.rotation);
        }

        if (p.type === "dot") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
          ctx.fill();
        } else if (p.type === "binary" || p.type === "symbol") {
          ctx.font = `300 ${p.size}px monospace`;
          ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.text || "", 0, 0);
        } else if (p.type === "geometry") {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          if (p.shape === "circle") {
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          } else if (p.shape === "square") {
            ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else if (p.shape === "triangle") {
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * Math.cos(Math.PI / 6), p.size * Math.sin(Math.PI / 6));
            ctx.lineTo(-p.size * Math.cos(Math.PI / 6), p.size * Math.sin(Math.PI / 6));
            ctx.closePath();
          }
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    initParticles();
    draw();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      // Debounce resize to avoid excessive calculations
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 200);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
      style={{
        maskImage: "radial-gradient(ellipse at center, transparent 0%, black 10%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, transparent 0%, black 10%)",
      }}
    />
  );
}
