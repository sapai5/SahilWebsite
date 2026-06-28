"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp, StaggerCards, StaggerCard } from "@/components/primitives";
import { GlassCard } from "@/components/glass";
import { projects } from "@/lib/data";
import { IconArrow } from "@/components/icons";

// WorldHero renders a World Labs Marble Gaussian-splat world via Spark (WebGL +
// WASM), so it must run client-side only.
const WorldHero = dynamic(() => import("@/components/WorldHero"), { ssr: false });

const featured = projects.filter((p) =>
  ["Equalify", "GlobeTrail", "Mining AI"].includes(p.title),
);

const whatIDo = [
  { n: "01", title: "Backend & distributed systems", desc: "Services that survive real traffic. SCTE-35 ad-marker clip harvesting for AWS Elemental MediaPackage (just-in-time HLS/DASH video packaging) in Kotlin & C++, and .NET microservices on AVEVA's ChangeBroker moving 150M+ events a day." },
  { n: "02", title: "Cloud & delivery", desc: "Docker, Kubernetes, Helm, CI/CD, and on-call. The production deploys and alarming that catch Sev-2/3 incidents before customers do." },
  { n: "03", title: "AI that does something", desc: "A globally #1 sustainability model, agentic MCP-driven workflows, and real-time CV coaching. ML that ships, not demos." },
];

export default function Home() {
  // Boot splash — present from the first server-rendered paint, lifted once the
  // (client-only) hero has mounted and taken over the screen.
  const [booting, setBooting] = useState(true);
  const handleHeroReady = useCallback(() => setBooting(false), []);

  return (
    <>
      {/* Boot splash — inline styles so it covers before the stylesheet applies */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#eef1f6",
          opacity: booting ? 1 : 0,
          pointerEvents: booting ? "auto" : "none",
          transition: "opacity 0.5s ease",
        }}
      >
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-[1.5px] border-black/10" />
          <div
            className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-black/40 animate-spin"
            style={{ animationDuration: "0.75s" }}
          />
        </div>
      </div>

      {/* Splat hero (home only) */}
      <div className="relative z-10 w-full">
        <WorldHero onReady={handleHeroReady} />
      </div>

      {/* ── EDITORIAL LANDING ───────────────────────────────────── */}
      <main className="relative z-10">
        {/* Thesis */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-28">
          <div className="max-w-3xl">
            <FadeUp>
              <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] font-bold tracking-[-0.04em] text-[#1d1d1f] leading-[1.05]">
                Fullstack developer
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-8 text-[clamp(1.05rem,2vw,1.35rem)] leading-relaxed text-black/55 font-light max-w-2xl">
                I love building projects in my spare time. Dive into the site and take a look around.
              </p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/work" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wide bg-[#1d1d1f] text-white hover:bg-[#3d3d3f] shadow-md transition-colors duration-300">
                  See the work <IconArrow className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wide lg-glass lg-glass-hover text-black/60 hover:text-black/85">
                  Get in touch
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Selected work */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
          <FadeUp>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-black/25 font-medium mb-3">Selected work</p>
                <h2 className="text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold tracking-[-0.04em] text-[#1d1d1f]">Built to ship.</h2>
              </div>
              <Link href="/projects" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-black/45 hover:text-black/75 transition-colors duration-200 shrink-0">
                All projects <IconArrow className="w-3.5 h-3.5" />
              </Link>
            </div>
          </FadeUp>
          <StaggerCards className="grid md:grid-cols-3 gap-4">
            {featured.map((p) => (
              <StaggerCard key={p.title}>
                <motion.a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -6 }}
                  className="block h-full rounded-3xl lg-glass lg-glass-hover p-7"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center lg-tile ${p.iconBg}`}>{p.icon}</div>
                    <span className="text-[9px] tracking-widest uppercase text-black/30 text-right leading-tight max-w-[120px]">{p.award}</span>
                  </div>
                  <h3 className="text-[1rem] font-semibold text-[#1d1d1f] tracking-tight mb-2">{p.title}</h3>
                  <p className="text-[12.5px] text-black/45 leading-relaxed">{p.desc}</p>
                </motion.a>
              </StaggerCard>
            ))}
          </StaggerCards>
        </section>

        {/* What I do */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
          <FadeUp>
            <p className="text-[11px] tracking-[0.25em] uppercase text-black/25 font-medium mb-12">What I do</p>
          </FadeUp>
          <StaggerCards className="grid md:grid-cols-3 gap-10">
            {whatIDo.map((w) => (
              <StaggerCard key={w.n}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-[13px] tabular-nums text-black/30 font-medium">{w.n}</span>
                  <h3 className="text-[1.15rem] font-semibold text-[#1d1d1f] tracking-tight">{w.title}</h3>
                </div>
                <p className="text-[13.5px] text-black/50 leading-relaxed pl-7">{w.desc}</p>
              </StaggerCard>
            ))}
          </StaggerCards>
        </section>

        {/* Currently */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
          <FadeUp>
            <GlassCard hover={false} className="p-8 md:p-12">
              <p className="text-[11px] tracking-[0.25em] uppercase text-black/25 font-medium mb-4">Currently</p>
              <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.03em] text-[#1d1d1f]">
                SDE Intern at Amazon (AWS)
              </h3>
              <p className="mt-3 text-[15px] text-black/50 max-w-xl leading-relaxed">
                AWS Elemental @ MediaPackage
              </p>
              <Link href="/work" className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-black/55 hover:text-black/85 transition-colors duration-200">
                See the full path <IconArrow className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>
          </FadeUp>
        </section>

        {/* Closing CTA */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-36">
          <FadeUp>
            <div className="flex flex-col items-start gap-6">
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.04em] text-[#1d1d1f] max-w-2xl leading-[1.1]">
                Got something hard to build?
              </h2>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wide bg-[#1d1d1f] text-white hover:bg-[#3d3d3f] shadow-md transition-colors duration-300">
                Get in touch <IconArrow className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        </section>
      </main>
    </>
  );
}
