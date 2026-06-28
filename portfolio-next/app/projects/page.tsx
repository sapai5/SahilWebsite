"use client";

import { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { EASE, FadeUp, StaggerCards, StaggerCard } from "@/components/primitives";
import { SectionHeader } from "@/components/glass";
import ProjectCarousel from "@/components/ProjectCarousel";
import LaptopReveal from "@/components/LaptopReveal";
import { projects, skills } from "@/lib/data";
import { IconGitHub, IconArrow } from "@/components/icons";

export default function ProjectsPage() {
  const laptopBoxRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: laptopBoxRef, offset: ["start end", "center 0.6"] });

  return (
    <main className="relative z-10 pt-28 min-h-screen">
      {/* Full-screen laptop that shrinks into the box below as you scroll */}
      <LaptopReveal progress={scrollYProgress} targetRef={laptopBoxRef} />

      {/* Projects */}
      <section id="projects" className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <SectionHeader label="01 · Projects" title="Things I've Built" />
        </div>

        <FadeUp>
          <ProjectCarousel>
            {projects.map((p, idx) => (
              <motion.a
                key={p.title}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 0.55, delay: idx * 0.07, ease: EASE }}
                whileHover={{ y: -6 }}
                className="flex-shrink-0 w-[300px] rounded-3xl lg-glass lg-glass-hover p-7 flex flex-col select-none"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center lg-tile ${p.iconBg} flex-shrink-0`}>
                    {p.icon}
                  </div>
                  <span className="text-[9px] tracking-widest uppercase text-black/30 text-right leading-tight max-w-[120px]">
                    {p.award}
                  </span>
                </div>
                <h3 className="text-[1rem] font-semibold text-[#1d1d1f] tracking-tight mb-2">{p.title}</h3>
                <p className="text-[12.5px] text-black/45 leading-relaxed mb-5 flex-1">{p.desc}</p>
                <div className="flex gap-4 border-t border-black/[0.06] pt-4 mb-5">
                  {p.stats.map((s) => (
                    <div key={s.l}>
                      <div className="text-sm font-bold text-[#1d1d1f]/65 tracking-tight">{s.v}</div>
                      <div className="text-[9px] tracking-wide text-black/25 uppercase">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full lg-pill text-[10px] tracking-wide text-black/55">{t}</span>
                  ))}
                </div>
              </motion.a>
            ))}

            <motion.a
              href="https://github.com/sapai5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-[240px] rounded-3xl border border-dashed border-black/[0.12] bg-white/40 p-7 flex flex-col items-center justify-center gap-4 hover:bg-white/70 transition-colors duration-300 select-none"
              whileHover={{ y: -4 }}
            >
              <div className="w-10 h-10 rounded-2xl border border-black/[0.09] bg-white/70 flex items-center justify-center text-black/40">
                <IconGitHub className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-medium text-black/50 mb-1">See all projects</p>
                <p className="text-[10px] tracking-wide text-black/25">github.com/sapai5</p>
              </div>
              <IconArrow className="w-3.5 h-3.5 text-black/20" />
            </motion.a>
          </ProjectCarousel>
        </FadeUp>
      </section>

      {/* What I like to do (the laptop lands in the empty slot on the right) */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16">
        <SectionHeader label="How I work" title="What I like to do" />
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <FadeUp>
            <div className="space-y-5 text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-black/55 font-light max-w-lg">
              <p>
                I gravitate toward <em className="italic text-black/80">backend and systems work</em>: the
                load-bearing stuff like distributed services, streaming pipelines, and the infrastructure underneath.
              </p>
              <p>
                Hand me a hard problem to own end to end and make <em className="italic text-black/80">boringly
                reliable</em>, and I&apos;m happy. Most of it happens right here.
              </p>
            </div>
          </FadeUp>
          {/* landing slot for the laptop */}
          <div ref={laptopBoxRef} className="h-[320px] md:h-[440px]" />
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pb-28">
        <SectionHeader label="Stack" title="Technical Skills" />
        <StaggerCards className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          {skills.map((g) => (
            <StaggerCard key={g.cat}>
              <p className="text-[10px] tracking-[0.25em] uppercase text-black/25 font-medium mb-4">{g.cat}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
                    whileHover={{ scale: 1.06, y: -2 }}
                    className="px-3.5 py-1.5 rounded-full lg-pill text-[12px] text-black/50 hover:text-black/80 transition-colors duration-200 cursor-default"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </StaggerCard>
          ))}
        </StaggerCards>
      </section>
    </main>
  );
}
