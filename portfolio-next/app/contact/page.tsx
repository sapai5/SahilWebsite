"use client";

import { motion } from "framer-motion";
import { EASE, FadeUp, StaggerCards, StaggerCard } from "@/components/primitives";
import { SectionHeader } from "@/components/glass";
import { IconMail, IconPhone, IconLinkedIn, IconGitHub, IconArrow } from "@/components/icons";

const channels = [
  { label: "Email", value: "sapai1@asu.edu", href: "mailto:sapai1@asu.edu", icon: <IconMail /> },
  { label: "Phone", value: "Email me!", href: "tel:+19712778872", icon: <IconPhone /> },
  { label: "LinkedIn", value: "linkedin.com/in/sahilapai", href: "https://linkedin.com/in/sahilapai", icon: <IconLinkedIn /> },
  { label: "GitHub", value: "github.com/sapai5", href: "https://github.com/sapai5", icon: <IconGitHub /> },
];

export default function ContactPage() {
  return (
    <main className="relative z-10 pt-28 min-h-screen">
      <section id="contact" className="max-w-6xl mx-auto px-6 md:px-12 py-20 pb-36">
        <SectionHeader label="04 · Contact" title="Let's Connect" />
        <FadeUp delay={0.1}>
          <p className="text-black/40 text-[15px] mb-14 max-w-md font-light -mt-10">
            Open to internships, full-time roles, and interesting collaborations.
          </p>
        </FadeUp>
        <StaggerCards className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {channels.map((c) => (
            <StaggerCard key={c.label}>
              <motion.a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="group rounded-3xl lg-glass lg-glass-hover p-6 transition-colors duration-300 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl border border-black/[0.08] bg-black/[0.04] flex items-center justify-center text-black/40 group-hover:text-black/65 group-hover:bg-black/[0.07] transition-all duration-300">{c.icon}</div>
                  <IconArrow className="w-3.5 h-3.5 text-black/15 group-hover:text-black/35 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black/25 font-medium mb-1">{c.label}</p>
                  <p className="text-[12px] text-black/50 group-hover:text-black/70 transition-colors duration-200 break-all">{c.value}</p>
                </div>
              </motion.a>
            </StaggerCard>
          ))}
        </StaggerCards>
      </section>
    </main>
  );
}
