"use client";

import { FadeUp, StaggerCards, StaggerCard } from "@/components/primitives";
import { GlassCard, SectionHeader } from "@/components/glass";
import { awards } from "@/lib/data";

export default function AboutPage() {
  return (
    <main className="relative z-10 pt-28 min-h-screen">
      {/* About intro */}
      <section id="about" className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <SectionHeader label="03 · About" title="A bit about me" />
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-center">
          <FadeUp>
            <div className="text-[clamp(1.05rem,2vw,1.4rem)] leading-relaxed text-black/60 font-light space-y-5">
              <p>
                I&apos;m a CS student at <span className="text-black/80">ASU&apos;s Barrett Honors College</span> and a
                software engineer who likes to <em className="italic text-black/80">own problems end to end</em>, from
                distributed backend systems to the models and infrastructure underneath.
              </p>
              <p>
                I&apos;ve shipped microservices at <span className="text-black/80">AVEVA</span>, automation at{" "}
                <span className="text-black/80">Intel</span>, and I&apos;m an SDE intern at{" "}
                <span className="text-black/80">AWS Elemental</span>. On the side I founded{" "}
                <span className="text-black/80">TerraMind</span>, won a few hackathons, and keynoted to 6,000+ executives.
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="relative rounded-3xl overflow-hidden lg-glass p-1.5 w-full max-w-xs mx-auto lg:mx-0 lg:ml-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/about.webp" alt="Sahil A. Pai" className="w-full h-auto rounded-[1.35rem] object-cover" />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
        <SectionHeader label="Recognition" title="Awards & Honors" />
        <StaggerCards className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {awards.map((a) => (
            <StaggerCard key={a.l}>
              <GlassCard className="p-7 flex flex-col gap-5">
                <div className={`w-10 h-10 rounded-2xl lg-tile flex items-center justify-center ${a.iconBg}`}>{a.icon}</div>
                <div>
                  <div className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight text-[#1d1d1f] leading-none mb-1">{a.n}</div>
                  <div className="text-[12px] font-medium text-black/55 mb-1">{a.l}</div>
                  <div className="text-[11px] text-black/25">{a.sub}</div>
                </div>
              </GlassCard>
            </StaggerCard>
          ))}
        </StaggerCards>
      </section>
    </main>
  );
}
