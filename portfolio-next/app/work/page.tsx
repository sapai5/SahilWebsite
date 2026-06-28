"use client";

import { FadeUp } from "@/components/primitives";
import { SectionHeader } from "@/components/glass";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { TerraMindSection } from "@/components/TerraMindSection";

export default function WorkPage() {
  return (
    <main className="relative z-10 pt-28 min-h-screen">
      <section id="experience" className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <SectionHeader label="01 · Work" title="Where I've Worked" />
        <ExperienceTimeline />
      </section>

      <FadeUp>
        <TerraMindSection />
      </FadeUp>
    </main>
  );
}
