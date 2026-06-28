"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + slide up on scroll into view */
export function FadeUp({
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
export function ParallaxText({
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
export function StaggerCards({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
export function StaggerCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
