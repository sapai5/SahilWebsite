"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE, FadeUp, StaggerCards, StaggerCard } from "./primitives";
import { GlassCard, SectionHeader } from "./glass";
import { IconLayers } from "./icons";

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);

export function TerraMindSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = [
    { src: "/terramind1.jpg", alt: "AVEVA World ASU Slide", objectPosition: "10% center", scale: 1 },
    { src: "/terramind2.jpg", alt: "On Stage Pitching", objectPosition: "center 10%", scale: 1.5 },
    { src: "/terramind3.jpg", alt: "With Simone Biles", objectPosition: "center 15%", scale: 1 },
  ];

  const variants = {
    active: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 30 },
    next: { x: 0, y: 0, scale: 0.95, rotate: 3, opacity: 1, zIndex: 20 },
    next2: { x: 0, y: 0, scale: 0.9, rotate: -3, opacity: 1, zIndex: 10 },
    flipped: { x: 300, y: 50, scale: 1, rotate: 15, opacity: 0, zIndex: 40 },
  };

  return (
    <section id="leadership" className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
      <SectionHeader label="Entrepreneurship" title="TerraMind" />
      <FadeUp>
        <GlassCard hover={false} className="relative overflow-hidden p-8 md:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

          <div className="relative flex flex-col lg:flex-row gap-12 items-center lg:items-center">
            {/* Left Side: Content */}
            <div className="flex flex-col flex-1 w-full lg:w-1/2 justify-center">
              <div className="flex gap-4 items-start mb-6">
                <div className="w-12 h-12 rounded-2xl lg-tile bg-violet-100 flex items-center justify-center shrink-0">
                  <IconLayers className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300/50 bg-emerald-50 text-[10px] tracking-widest uppercase text-emerald-700 font-semibold mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Global #1 Winner
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] tracking-tight">Founder &amp; Keynote Speaker</h3>
                  <p className="text-sm text-violet-600/70 font-medium mt-1">Tempe, AZ · October 2024 – Present</p>
                </div>
              </div>

              <StaggerCards className="flex flex-wrap gap-3 mb-8">
                {[{ n: "$13K", l: "Prize" }, { n: "95%", l: "Accuracy" }, { n: "100+", l: "Teams beaten" }].map((s) => (
                  <StaggerCard key={s.l} className="rounded-2xl lg-glass px-5 py-3 text-center min-w-[80px] flex-1">
                    <div className="text-lg md:text-xl font-bold tracking-tight text-[#1d1d1f]">{s.n}</div>
                    <div className="text-[10px] tracking-widest uppercase text-black/40 mt-1 font-semibold">{s.l}</div>
                  </StaggerCard>
                ))}
              </StaggerCards>

              <ul className="space-y-4 mb-8">
                {[
                  "Won 1st Place globally at AVEVA EcoTech Emerge AI World Championship against 100+ international teams; attracted Y Combinator angel investor interest.",
                  "Built AI mining sustainability platform using CNNs & decision trees to predict toxic mineral locations with 95% accuracy.",
                  "Architected full-stack system with Gemini API, MongoDB, and PostgreSQL, achieving sub-20-second sustainability analysis response times.",
                  "Delivered keynote on predictive & agentic AI to 6,000+ Fortune 500 executives at AVEVA World Conference, San Francisco.",
                ].map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed font-medium">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {["Gemini API", "CNNs", "Decision Trees", "MongoDB", "PostgreSQL", "Keynote"].map((t, i) => (
                  <motion.span
                    key={t}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                    className="px-3 py-1.5 rounded-full lg-pill text-xs font-semibold text-black/55 tracking-wide"
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Right Side: Clickable Photo Stack */}
            <div className="w-full lg:w-1/2 max-sm:h-[300px] max-w-sm lg:max-w-md relative aspect-[4/3] shrink-0 xl:mr-3 flex flex-col items-center justify-center">
              <div className="relative w-full h-full">
                {images.map((img, i) => {
                  const diff = i - activeIndex;
                  let state = "active";
                  if (diff < 0) state = "flipped";
                  else if (diff === 0) state = "active";
                  else if (diff === 1) state = "next";
                  else state = "next2";

                  return (
                    <motion.div
                      key={img.src}
                      variants={variants}
                      initial={false}
                      animate={state}
                      drag={state === "active" ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -80) {
                          setActiveIndex((v) => Math.min(images.length - 1, v + 1));
                        } else if (info.offset.x > 80) {
                          setActiveIndex((v) => Math.max(0, v - 1));
                        }
                      }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/40 origin-center bg-black/5 ${state === "active" ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover pointer-events-none z-10 transition-transform duration-500"
                        style={{ objectPosition: img.objectPosition, transform: `scale(${img.scale})` }}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile Swipe Hint */}
              <div className="md:hidden mt-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-black/30 animate-pulse">
                <ChevronLeft />
                <span>Swipe to flip</span>
                <ChevronRight />
              </div>

              {/* Navigation Arrows (Desktop only) */}
              <div className="absolute -bottom-16 right-0 hidden md:flex gap-3 z-50">
                <button
                  onClick={() => setActiveIndex((v) => Math.max(0, v - 1))}
                  disabled={activeIndex === 0}
                  className="w-10 h-10 rounded-full lg-glass lg-glass-hover flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all text-black/70 hover:text-black hover:scale-105 active:scale-95"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={() => setActiveIndex((v) => Math.min(images.length - 1, v + 1))}
                  disabled={activeIndex === images.length - 1}
                  className="w-10 h-10 rounded-full lg-glass lg-glass-hover flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all text-black/70 hover:text-black hover:scale-105 active:scale-95"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </FadeUp>
    </section>
  );
}
