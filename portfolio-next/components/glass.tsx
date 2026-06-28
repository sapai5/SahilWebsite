"use client";

import { motion } from "framer-motion";
import { EASE, FadeUp, ParallaxText } from "./primitives";

/* GLASS CARD */
export function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.3, ease: EASE }}
      className={`rounded-3xl lg-glass ${hover ? "lg-glass-hover" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* GLASS BUTTON */
export function GlassButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wide transition-colors duration-300 ${primary
        ? "bg-[#1d1d1f] text-white hover:bg-[#3d3d3f] shadow-md"
        : "lg-glass lg-glass-hover text-black/60 hover:text-black/85"
        }`}
    >
      {children}
    </motion.a>
  );
}

/* SECTION HEADER */
export function SectionHeader({ label, title }: { label: string; title: React.ReactNode }) {
  return (
    <div className="mb-16">
      <FadeUp>
        <p className="text-[11px] tracking-[0.25em] uppercase text-black/25 font-medium mb-3">{label}</p>
      </FadeUp>
      <ParallaxText speed={20}>
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em] text-[#1d1d1f]">{title}</h2>
      </ParallaxText>
    </div>
  );
}
