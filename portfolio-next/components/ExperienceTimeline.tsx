"use client";

import { motion } from "framer-motion";
import { EASE } from "./primitives";
import { experiences } from "@/lib/data";

export function ExperienceTimeline() {
  return (
    <div className="relative max-w-3xl">
      {/* vertical spine */}
      <div className="absolute left-7 top-4 bottom-6 w-px bg-gradient-to-b from-black/15 via-black/10 to-transparent" />

      <div className="space-y-3">
        {experiences.map((exp, i) => (
          <motion.div
            key={exp.company}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
            className="group relative pl-20 pb-6"
          >
            {/* node icon */}
            <motion.div
              initial={{ scale: 0, rotate: -35, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={{ type: "spring", stiffness: 190, damping: 13, delay: i * 0.08 + 0.12 }}
              className={`absolute left-0 top-0 w-14 h-14 rounded-2xl lg-tile flex items-center justify-center ${exp.iconBg}`}
            >
              {exp.icon}
            </motion.div>

            {/* header (always visible) */}
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3 className="text-[1.05rem] font-semibold text-[#1d1d1f] tracking-tight">{exp.role}</h3>
                <span className="text-[11px] text-black/30 tracking-wide">{exp.period}</span>
              </div>
              <p className="text-sm text-black/45 mt-0.5">
                {exp.company} · {exp.team} · {exp.location}
              </p>
              <span className="hidden md:inline-block text-[10px] tracking-wide text-black/25 mt-1.5 transition-opacity duration-200 group-hover:opacity-0">
                hover for details ↓
              </span>
            </div>

            {/* details — expand on hover (desktop), always open on mobile */}
            <div className="grid grid-rows-[0fr] max-md:grid-rows-[1fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
              <div className="overflow-hidden">
                <div className="lg-glass-soft rounded-2xl p-5 mt-3 opacity-0 max-md:opacity-100 group-hover:opacity-100 transition-opacity duration-300">
                  <ul className="space-y-2.5 mb-4">
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} className="flex gap-3 text-[13px] text-black/55 leading-relaxed">
                        <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-black/25" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2">
                    {exp.tags.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full lg-pill text-[11px] tracking-wide text-black/50">{t}</span>
                    ))}
                    <div className="ml-auto text-right">
                      <div className="text-base font-bold text-[#1d1d1f]/70 tracking-tight">{exp.stat.n}</div>
                      <div className="text-[10px] text-black/25 tracking-wide">{exp.stat.l}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
