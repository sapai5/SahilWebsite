"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "./primitives";

const LINKS = [
  { n: "01", label: "Work", href: "/work" },
  { n: "02", label: "Projects", href: "/projects" },
  { n: "03", label: "About", href: "/about" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Nav hides at the very top and slides in once you start scrolling.
  const [scrolled, setScrolled] = useState(false);
  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the home page the nav hides over the hero and slides in on scroll.
  // On every other route it's always visible.
  const isHome = pathname === "/";
  const visible = !isHome || scrolled || open;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] bg-white/45 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-white/30 shadow-sm transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 h-[52px] flex items-center justify-between">
        <Link
          href="/"
          className="text-[12px] font-medium tracking-wide text-black/45 hover:text-black/70 transition-colors duration-200"
        >
          Sahil A. Pai
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`group px-4 py-1.5 rounded-full text-[12px] inline-flex items-center gap-1.5 transition-all duration-200 ${
                isActive(l.href)
                  ? "text-black/80 bg-black/[0.06]"
                  : "text-black/40 hover:text-black/80 hover:bg-black/[0.05]"
              }`}
            >
              <span className="text-[9px] tabular-nums text-black/30 group-hover:text-black/45">{l.n}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium tracking-wide bg-[#1d1d1f] text-white hover:bg-[#3d3d3f] shadow-sm transition-colors duration-200"
          >
            Get in touch
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] p-1"
            aria-label="Toggle menu"
          >
            <span className={`block h-[1.5px] w-5 bg-black/50 transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
            <span className={`block h-[1.5px] w-5 bg-black/50 transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-[1.5px] w-5 bg-black/50 transition-all duration-300 origin-center ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="md:hidden overflow-hidden border-t border-black/[0.06] bg-white/90"
      >
        <nav className="flex flex-col px-6 py-3 gap-1">
          {[...LINKS, { n: "04", label: "Contact", href: "/contact" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`py-2.5 text-[13px] border-b border-black/[0.05] last:border-0 transition-colors duration-200 ${
                isActive(l.href) ? "text-black/80" : "text-black/50 hover:text-black/80"
              }`}
            >
              <span className="text-[10px] tabular-nums text-black/30 mr-2">{l.n}</span>
              {l.label}
            </Link>
          ))}
        </nav>
      </motion.div>
    </header>
  );
}
