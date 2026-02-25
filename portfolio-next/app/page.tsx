"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import FileScroll from "@/components/FileScroll";
import ProjectCarousel from "@/components/ProjectCarousel";

/* ─────────────────────────────────────────
   ANIMATION UTILITIES
───────────────────────────────────────── */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + slide up on scroll into view */
function FadeUp({
  children,
  delay = 0,
  className = "",
  distance = 36,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  distance?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Parallax heading — moves at half scroll speed */
function ParallaxText({
  children,
  className = "",
  speed = 30,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Staggered container — animates children with increasing delay */
function StaggerCards({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ margin: "-60px" }}
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Single card within a StaggerCards container */
function StaggerCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   INLINE SVG ICONS
───────────────────────────────────────── */
function IconChip({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M7 9H5M7 12H5M7 15H5M17 9h2M17 12h2M17 15h2M9 7V5M12 7V5M15 7V5M9 17v2M12 17v2M15 17v2" />
    </svg>
  );
}
function IconLayers({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  );
}
function IconGlobe({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
    </svg>
  );
}
function IconTrophy({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v7a6 6 0 0 1-12 0V4z" /><path d="M12 17v4M8 21h8" />
    </svg>
  );
}
function IconBolt({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconStar({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconMic({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IconMail({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
    </svg>
  );
}
function IconPhone({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z" />
    </svg>
  );
}
function IconLinkedIn({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function IconGitHub({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}
function IconArrow({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────── */
function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, boxShadow: "0 8px 40px rgba(0,0,0,0.07)" } : undefined}
      transition={{ duration: 0.3, ease: EASE }}
      className={`rounded-3xl border border-black/[0.07] bg-white/70 backdrop-blur-xl shadow-sm ${hover ? "hover:bg-white/90 hover:border-black/[0.12] transition-colors duration-400" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   GLASS BUTTON
───────────────────────────────────────── */
function GlassButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wide transition-colors duration-300 ${primary
        ? "bg-[#1d1d1f] text-white hover:bg-[#3d3d3f] shadow-sm"
        : "bg-black/[0.05] backdrop-blur-xl border border-black/[0.1] text-black/60 hover:bg-black/[0.09] hover:text-black/80 hover:border-black/[0.16]"
        }`}
    >
      {children}
    </motion.a>
  );
}

/* ─────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────── */
function SectionHeader({ label, title }: { label: string; title: React.ReactNode }) {
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

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const experiences = [
  {
    role: "Software Engineering Intern",
    company: "Cambridge Research Investments",
    team: "Incoming · Summer 2026",
    period: "May – Aug 2026",
    location: "Phoenix, AZ",
    icon: <IconLayers className="w-5 h-5" />,
    accentBg: "from-sky-50 to-transparent",
    accentBorder: "border-sky-200/60",
    iconBg: "bg-sky-100 text-sky-600",
    tagBorder: "border-sky-200/60 text-sky-700/60 bg-sky-50/50",
    bullets: [
      "Incoming Software Engineering Intern.",
    ],
    tags: ["C# / .NET", "Finance", "Software Engineering"],
    stat: { n: "2026", l: "Start date" },
  },
  {
    role: "Software Engineering Intern",
    company: "AVEVA",
    team: "CONNECT Platform",
    period: "May – Aug 2025",
    location: "Scottsdale, AZ",
    icon: <IconChip className="w-5 h-5" />,
    accentBg: "from-violet-50 to-transparent",
    accentBorder: "border-violet-200/60",
    iconBg: "bg-violet-100 text-violet-600",
    tagBorder: "border-violet-200/60 text-violet-700/60 bg-violet-50/50",
    bullets: [
      "Architected C# .NET microservices processing 150M+ daily IoT data streams across 1,000+ global manufacturing facilities.",
      "Engineered RESTful & Minimal APIs serving 50,000+ concurrent requests daily with multi-layer architecture.",
      "Achieved 95% CI/CD code coverage; managed production Kubernetes deployments with Helm charts.",
    ],
    tags: ["C# / .NET", "Microservices", "Kubernetes", "REST APIs"],
    stat: { n: "150M+", l: "streams / day" },
  },
  {
    role: "Software Engineering Intern",
    company: "Intel Corporation",
    team: "Data Center AI Group",
    period: "May – Aug 2024",
    location: "Hillsboro, OR",
    icon: <IconBolt className="w-5 h-5" />,
    accentBg: "from-blue-50 to-transparent",
    accentBorder: "border-blue-200/60",
    iconBg: "bg-blue-100 text-blue-600",
    tagBorder: "border-blue-200/60 text-blue-700/60 bg-blue-50/50",
    bullets: [
      "Automated Cadence EDA privilege management for 1,000+ engineers — cut provisioning from 3+ days → under 2 hours.",
      "Optimized PCB export scripts: 99.95% runtime reduction (40+ hrs → 2 min), ~70% fewer export failures.",
    ],
    tags: ["Python", "Perl", "Automation", "EDA Tools"],
    stat: { n: "99.95%", l: "runtime reduction" },
  },
];

const projects = [
  {
    title: "Sahil's Portfolio",
    award: "Personal Website · 2026",
    desc: "Scroll-driven hero animation with 192 PNG frames rendered on canvas, Framer Motion parallax sections, and a mouse-driven project carousel — built with Next.js & TypeScript.",
    stats: [{ v: "192", l: "Hero frames" }, { v: "Next.js", l: "Framework" }, { v: "Framer", l: "Animations" }],
    tags: ["Next.js", "TypeScript", "Framer Motion", "Canvas API"],
    icon: <IconGlobe className="w-6 h-6" />,
    iconBg: "bg-indigo-100 text-indigo-600",
    border: "border-indigo-200/50",
    bg: "from-indigo-50/80 to-white/60",
    tagStyle: "border-indigo-200/50 text-indigo-700/60 bg-indigo-50/60",
    href: "https://github.com/sapai5/SahilWebsite",
  },
  {
    title: "Equalify",
    award: "1st Place · Fidelity Fintech · Sunhacks",
    desc: "Scholarship discovery platform aggregating $1M+ in opportunities for underrepresented students with intelligent demographic matching.",
    stats: [{ v: "$1M+", l: "Opportunities" }, { v: "85%", l: "Faster" }, { v: "200+", l: "Users" }],
    tags: ["Next.js", "Web Scraping", "ML Matching"],
    icon: <IconStar className="w-6 h-6" />,
    iconBg: "bg-emerald-100 text-emerald-600",
    border: "border-emerald-200/50",
    bg: "from-emerald-50/80 to-white/60",
    tagStyle: "border-emerald-200/50 text-emerald-700/60 bg-emerald-50/60",
    href: "https://github.com/sapai5/equalify",
  },
  {
    title: "GlobeTrail",
    award: "Sunhacks · Arizona State University",
    desc: "Agentic travel planning using Model Context Protocol to autonomously book flights, hotels, and activities with an interactive 3D globe.",
    stats: [{ v: "MCP", l: "Architecture" }, { v: "3D", l: "Globe viz" }, { v: "Live", l: "Pricing" }],
    tags: ["Three.js", "React", "MCP", "Agentic AI"],
    icon: <IconGlobe className="w-6 h-6" />,
    iconBg: "bg-sky-100 text-sky-600",
    border: "border-sky-200/50",
    bg: "from-sky-50/80 to-white/60",
    tagStyle: "border-sky-200/50 text-sky-700/60 bg-sky-50/60",
    href: "https://github.com/sapai5/globetrail",
  },
  {
    title: "Interview Lens",
    award: "Hackathon · SoDA 2024",
    desc: "Real-time interview coaching dashboard using computer vision & speech-to-text. Tracks eye contact, filler words, speech pace, and facial expressions via AWS Rekognition and Transcribe.",
    stats: [{ v: "Real-time", l: "CV Analysis" }, { v: "AWS", l: "Rekognition" }, { v: "4", l: "Contributors" }],
    tags: ["Python", "Streamlit", "AWS", "Computer Vision"],
    icon: <IconMic className="w-6 h-6" />,
    iconBg: "bg-rose-100 text-rose-600",
    border: "border-rose-200/50",
    bg: "from-rose-50/80 to-white/60",
    tagStyle: "border-rose-200/50 text-rose-700/60 bg-rose-50/60",
    href: "https://github.com/sapai5/Interview-Lens",
  },
  {
    title: "NoteFlow",
    award: "CSE412 · Arizona State University",
    desc: "Full-stack collaborative note-taking app with real-time sync, rich text editing, and course-organized notebooks for university students.",
    stats: [{ v: "Real-time", l: "Sync" }, { v: "Full-Stack", l: "App" }, { v: "DB", l: "Backed" }],
    tags: ["React", "Node.js", "PostgreSQL", "Full-Stack"],
    icon: <IconLayers className="w-6 h-6" />,
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200/50",
    bg: "from-amber-50/80 to-white/60",
    tagStyle: "border-amber-200/50 text-amber-700/60 bg-amber-50/60",
    href: "https://github.com/sapai5/CSE412-Noteflow",
  },
  {
    title: "Mining AI",
    award: "AVEVA EcoTech · Global #1 Winner",
    desc: "CNN + decision-tree model predicting toxic mineral deposit locations with 95% accuracy to help mining companies reduce environmental impact.",
    stats: [{ v: "95%", l: "Accuracy" }, { v: "CNN", l: "Architecture" }, { v: "Global #1", l: "Winner" }],
    tags: ["Python", "TensorFlow", "CNNs", "Gemini API"],
    icon: <IconChip className="w-6 h-6" />,
    iconBg: "bg-violet-100 text-violet-600",
    border: "border-violet-200/50",
    bg: "from-violet-50/80 to-white/60",
    tagStyle: "border-violet-200/50 text-violet-700/60 bg-violet-50/60",
    href: "https://github.com/sapai5/miningAI",
  },
  {
    title: "NeetCode GitHub Sync",
    award: "Chrome Extension · Open Source",
    desc: "Chrome extension that automatically pushes LeetCode solutions from NeetCode.io to a personal GitHub repository after every submission.",
    stats: [{ v: "Auto", l: "GitHub Push" }, { v: "Chrome", l: "Extension" }, { v: "Open", l: "Source" }],
    tags: ["JavaScript", "Chrome APIs", "GitHub API"],
    icon: <IconBolt className="w-6 h-6" />,
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200/50",
    bg: "from-blue-50/80 to-white/60",
    tagStyle: "border-blue-200/50 text-blue-700/60 bg-blue-50/60",
    href: "https://github.com/sapai5/neetcode-github-sync-chrome-extension",
  },
  {
    title: "StudyMatch",
    award: "Software Developer's Club Hackathon · ASU",
    desc: "Competitive hackathon submission building a platform to connect students for study sessions similar to Tinder.",
    stats: [{ v: "K-Means", l: "Clustering" }, { v: "Tinder", l: "UI/UX" }, { v: "Webscraped", l: "Data" }],
    tags: ["Python", "LLMs", "GitHub API", "DevOps"],
    icon: <IconTrophy className="w-6 h-6" />,
    iconBg: "bg-teal-100 text-teal-600",
    border: "border-teal-200/50",
    bg: "from-teal-50/80 to-white/60",
    tagStyle: "border-teal-200/50 text-teal-700/60 bg-teal-50/60",
    href: "https://github.com/sapai5/SoDA2024Hack",
  },
];

const skills = [
  { cat: "Languages", items: ["C#", "C++", "Java", "Python", "Go", "SQL", "LINQ", "JavaScript", "TypeScript", "YAML", "Perl"] },
  { cat: "Frameworks", items: ["ASP.NET Core", ".NET Framework", "React", "Node.js", "Three.js", "Express", "TensorFlow"] },
  { cat: "Cloud & DevOps", items: ["AWS (EC2, S3, Lambda)", "Azure", "Docker", "Kubernetes", "Helm", "CI/CD", "Git", "Jenkins"] },
  { cat: "Tools & Data", items: ["MongoDB", "PostgreSQL", "Redis", "Postman", "Swagger", "RESTful APIs", "Microservices"] },
];

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef });
  const smoothHero = useSpring(heroProgress, { stiffness: 100, damping: 28, restDelta: 0.001 });
  const contentY = useTransform(smoothHero, [0.70, 1.0], [220, 0]);

  // Hero section heading parallax (moves slower than scroll as user scrolls away)
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroSectionProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"],
  });
  const heroHeadingY = useTransform(heroSectionProgress, [0, 1], [0, -60]);

  return (
    <main className="bg-[#F5F5F7] selection:bg-black/10">

      {/* ══ SCROLL HERO ════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative z-10">
        <FileScroll />
      </div>

      {/* ══ RISING CONTENT ═══════════════════════════════════════ */}
      <motion.div style={{ y: contentY }} className="-mt-[20vh] relative z-0">

        {/* ── STICKY NAV ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="sticky top-0 z-40 bg-[#F5F5F7]/75 backdrop-blur-2xl border-b border-black/[0.07]"
        >
          <div className="max-w-6xl mx-auto px-6 md:px-12 h-[52px] flex items-center justify-between">
            <motion.a
              href="#"
              whileHover={{ opacity: 0.6 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] font-medium tracking-wide text-black/35 hover:text-black/60 transition-colors duration-200"
            >
              Sahil A. Pai
            </motion.a>
            <nav className="hidden md:flex items-center gap-1">
              {["Experience", "Leadership", "Projects", "Awards", "Contact"].map((s, i) => (
                <motion.a
                  key={s}
                  href={`#${s.toLowerCase()}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: EASE }}
                  className="px-4 py-1.5 rounded-full text-[12px] text-black/40 hover:text-black/80 hover:bg-black/[0.05] transition-all duration-200"
                >
                  {s}
                </motion.a>
              ))}
            </nav>
            <GlassButton href="#contact">Get in touch</GlassButton>
          </div>
        </motion.div>

        {/* ── HERO TEXT ─────────────────────────────────────────── */}
        <section ref={heroSectionRef} className="max-w-6xl mx-auto px-6 md:px-12 pt-[22vh] pb-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0, ease: EASE }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.09] bg-white/60 backdrop-blur text-[11px] text-black/40 tracking-wide sm:tracking-widest uppercase mb-8 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                Available for opportunities
              </div>
            </motion.div>

            <motion.h1
              style={{ y: heroHeadingY }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
              className="text-[clamp(3rem,7vw,6rem)] font-bold tracking-[-0.04em] text-[#1d1d1f] leading-[1.02] mb-6"
            >
              Sahil Pai
            </motion.h1>

            <FadeUp delay={0.2}>
              <p className="text-[clamp(1rem,2vw,1.2rem)] text-black/45 font-light leading-relaxed mb-10 max-w-xl">
                Software engineer &amp; founder building AI-powered systems at scale. CS at{" "}
                <span className="text-black/70">ASU Barrett Honors College</span> · GPA 3.81.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-wrap items-center gap-3">
                <GlassButton href="#experience" primary>View work</GlassButton>
                <GlassButton href="#contact">Contact me</GlassButton>
                <motion.a
                  href="https://linkedin.com/in/sahilapai" target="_blank" rel="noopener"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/60 border border-black/[0.08] text-black/45 hover:text-black/70 hover:bg-white/90 transition-all duration-300 text-sm shadow-sm"
                >
                  <IconLinkedIn className="w-4 h-4" /> LinkedIn
                </motion.a>
                <motion.a
                  href="https://github.com/sapai5" target="_blank" rel="noopener"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/60 border border-black/[0.08] text-black/45 hover:text-black/70 hover:bg-white/90 transition-all duration-300 text-sm shadow-sm"
                >
                  <IconGitHub className="w-4 h-4" /> GitHub
                </motion.a>
              </div>
            </FadeUp>
          </div>

          {/* Stat strip */}
          <FadeUp delay={0.4} className="mt-20">
            <StaggerCards className="grid grid-cols-2 md:grid-cols-4 gap-px bg-black/[0.07] rounded-3xl overflow-hidden border border-black/[0.07] shadow-sm">
              {[
                { n: "3", l: "Internships", icon: <IconChip className="w-4 h-4" /> },
                { n: "$19K", l: "Hackathon winnings", icon: <IconTrophy className="w-4 h-4" /> },
                { n: "6,000+", l: "Executives addressed", icon: <IconMic className="w-4 h-4" /> },
                { n: "3.81", l: "GPA — Dean's List", icon: <IconStar className="w-4 h-4" /> },
              ].map((s) => (
                <StaggerCard key={s.l} className="bg-[#F5F5F7] px-8 py-7 flex flex-col gap-3">
                  <div className="text-black/25">{s.icon}</div>
                  <div className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-tight text-[#1d1d1f] leading-none">{s.n}</div>
                  <div className="text-[11px] tracking-wide text-black/30">{s.l}</div>
                </StaggerCard>
              ))}
            </StaggerCards>
          </FadeUp>
        </section>

        {/* ── EXPERIENCE ────────────────────────────────────────── */}
        <section id="experience" className="max-w-6xl mx-auto px-6 md:px-12 py-28">
          <SectionHeader label="Experience" title="Where I've Worked" />
          <StaggerCards className="space-y-5">
            {experiences.map((exp) => (
              <StaggerCard key={exp.company}>
                <GlassCard className={`relative overflow-hidden bg-gradient-to-br ${exp.accentBg} ${exp.accentBorder} p-8 md:p-10`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
                  <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${exp.iconBg}`}>{exp.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <p className="text-[11px] tracking-widest uppercase text-black/25 mb-1">{exp.team}</p>
                          <h3 className="text-[1.15rem] font-semibold text-[#1d1d1f] tracking-tight">{exp.role}</h3>
                          <p className="text-sm text-black/40 mt-0.5">{exp.company}</p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                          <span className="px-3 py-1 rounded-full border border-black/[0.09] bg-white/60 text-[11px] text-black/40 tracking-wide shadow-sm">{exp.period}</span>
                          <span className="text-[11px] text-black/25">{exp.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 pl-[68px]">
                    {exp.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 text-[13.5px] text-black/50 leading-relaxed">
                        <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-black/20" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2 pl-[68px]">
                    {exp.tags.map((t) => (
                      <span key={t} className={`px-3 py-1 rounded-full border text-[11px] tracking-wide ${exp.tagBorder}`}>{t}</span>
                    ))}
                    <div className="ml-auto text-right">
                      <div className="text-lg font-bold text-[#1d1d1f]/70 tracking-tight">{exp.stat.n}</div>
                      <div className="text-[10px] text-black/25 tracking-wide">{exp.stat.l}</div>
                    </div>
                  </div>
                </GlassCard>
              </StaggerCard>
            ))}
          </StaggerCards>
        </section>

        {/* ── TERRAMIND ─────────────────────────────────────────── */}
        <section id="leadership" className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
          <SectionHeader label="Entrepreneurship" title="TerraMind" />
          <FadeUp>
            <GlassCard hover={false} className="relative overflow-hidden border-violet-200/60 p-8 md:p-12 bg-gradient-to-br from-violet-50/70 to-white/50">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />
              <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200/60 flex items-center justify-center shrink-0">
                    <IconLayers className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300/50 bg-emerald-50 text-[10px] tracking-widest uppercase text-emerald-700 font-semibold mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Global #1 Winner
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">Founder &amp; Keynote Speaker</h3>
                    <p className="text-sm text-violet-600/60 mt-1">Tempe, AZ · October 2024 – Present</p>
                  </div>
                </div>
                <StaggerCards className="flex gap-3 shrink-0">
                  {[{ n: "$13K", l: "Prize" }, { n: "95%", l: "Accuracy" }, { n: "100+", l: "Teams beaten" }].map((s) => (
                    <StaggerCard key={s.l} className="rounded-2xl border border-black/[0.07] bg-white/70 backdrop-blur px-4 py-4 text-center min-w-[76px] shadow-sm">
                      <div className="text-[1.2rem] font-bold tracking-tight text-[#1d1d1f]">{s.n}</div>
                      <div className="text-[9px] tracking-widest uppercase text-black/25 mt-1">{s.l}</div>
                    </StaggerCard>
                  ))}
                </StaggerCards>
              </div>
              <ul className="relative space-y-3.5 mb-10 ml-[68px]">
                {[
                  "Won 1st Place globally at AVEVA EcoTech Emerge AI World Championship — 100+ international teams; attracted Y Combinator angel investor interest.",
                  "Built AI mining sustainability platform using CNNs & decision trees to predict toxic mineral locations with 95% accuracy.",
                  "Architected full-stack system with Gemini API, MongoDB, and PostgreSQL — sub-20-second sustainability analysis response times.",
                  "Delivered keynote on predictive & agentic AI to 6,000+ Fortune 500 executives at AVEVA World Conference, San Francisco.",
                ].map((b, i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] text-black/50 leading-relaxed">
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-violet-400/50" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="relative flex flex-wrap gap-2 ml-[68px]">
                {["Gemini API", "CNNs", "Decision Trees", "MongoDB", "PostgreSQL", "Keynote"].map((t, i) => (
                  <motion.span
                    key={t}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                    className="px-3 py-1 rounded-full border border-violet-200/50 bg-violet-50 text-[11px] text-violet-700/60 tracking-wide"
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
            </GlassCard>
          </FadeUp>
        </section>

        {/* ── PROJECTS ──────────────────────────────────────────── */}
        <section id="projects" className="pb-28">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <SectionHeader label="Projects" title="Things I've Built" />
          </div>

          {/* Mouse-driven horizontal scroll with blurred edges */}
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
                  whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}
                  className={`flex-shrink-0 w-[300px] rounded-3xl border bg-gradient-to-br ${p.bg} ${p.border} p-7 flex flex-col backdrop-blur-xl shadow-sm select-none`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${p.iconBg} flex-shrink-0`}>
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
                      <span key={t} className={`px-2.5 py-1 rounded-full border text-[10px] tracking-wide ${p.tagStyle}`}>{t}</span>
                    ))}
                  </div>
                </motion.a>
              ))}

              {/* GitHub CTA card */}
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

        {/* ── AWARDS ────────────────────────────────────────────── */}
        <section id="awards" className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
          <SectionHeader label="Recognition" title="Awards & Honors" />
          <StaggerCards className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "$19K", l: "Hackathon Winnings", sub: "3× Winner · 2024–25", icon: <IconTrophy className="w-5 h-5" />, iconBg: "bg-amber-100 text-amber-600 border-amber-200/60" },
              { n: "#1", l: "AVEVA AI Championship", sub: "100+ international teams", icon: <IconGlobe className="w-5 h-5" />, iconBg: "bg-violet-100 text-violet-600 border-violet-200/60" },
              { n: "$4K", l: "Andy Grove Scholarship", sub: "Intel · STEM Excellence 2024", icon: <IconBolt className="w-5 h-5" />, iconBg: "bg-blue-100 text-blue-600 border-blue-200/60" },
              { n: "6K+", l: "Executives Addressed", sub: "AVEVA World Conf · SF", icon: <IconMic className="w-5 h-5" />, iconBg: "bg-rose-100 text-rose-600 border-rose-200/60" },
            ].map((a) => (
              <StaggerCard key={a.l}>
                <GlassCard className="p-7 flex flex-col gap-5">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${a.iconBg}`}>{a.icon}</div>
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

        {/* ── SKILLS ────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
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
                      className="px-3.5 py-1.5 rounded-full border border-black/[0.08] bg-white/70 text-[12px] text-black/45 hover:text-black/70 hover:border-black/[0.16] hover:bg-white/90 transition-colors duration-200 cursor-default shadow-sm"
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </StaggerCard>
            ))}
          </StaggerCards>
        </section>

        {/* ── CONTACT ───────────────────────────────────────────── */}
        <section id="contact" className="max-w-6xl mx-auto px-6 md:px-12 pb-36">
          <SectionHeader label="Contact" title="Let's Connect" />
          <FadeUp delay={0.1}>
            <p className="text-black/40 text-[15px] mb-14 max-w-md font-light -mt-10">Open to internships, full-time roles, and interesting collaborations.</p>
          </FadeUp>
          <StaggerCards className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Email", value: "sapai1@asu.edu", href: "mailto:sapai1@asu.edu", icon: <IconMail /> },
              { label: "Phone", value: "Email me!", href: "tel:+19712778872", icon: <IconPhone /> },
              { label: "LinkedIn", value: "linkedin.com/in/sahilapai", href: "https://linkedin.com/in/sahilapai", icon: <IconLinkedIn /> },
              { label: "GitHub", value: "github.com/sapai5", href: "https://github.com/sapai5", icon: <IconGitHub /> },
            ].map((c) => (
              <StaggerCard key={c.label}>
                <motion.a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.09)" }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="group rounded-3xl border border-black/[0.07] bg-white/70 backdrop-blur-xl p-6 hover:bg-white/90 hover:border-black/[0.14] transition-colors duration-300 flex flex-col gap-4 shadow-sm"
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

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <FadeUp>
          <footer className="border-t border-black/[0.06] py-8">
            <div className="max-w-6xl mx-auto px-6 md:px-12 flex justify-between items-center">
              <span className="text-[11px] tracking-widest text-black/20">Sahil A. Pai</span>
              <span className="text-[11px] text-black/20">© 2026</span>
            </div>
          </footer>
        </FadeUp>

      </motion.div>
    </main>
  );
}
