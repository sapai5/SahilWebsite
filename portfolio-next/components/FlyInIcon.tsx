"use client";

import { motion } from "framer-motion";

export function FlyInIcon({
  children,
  iconBg,
  index,
}: {
  children: React.ReactNode;
  iconBg: string;
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <div className="relative z-50 shrink-0 w-11 h-11">
      <motion.div
        initial={{ y: "-60vh", x: isEven ? "12vw" : "-12vw", scale: 3.5, opacity: 0, rotate: isEven ? -40 : 40 }}
        whileInView={{ y: 0, x: 0, scale: 1, opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ type: "spring", stiffness: 55, damping: 13, delay: index * 0.08 }}
        style={{ willChange: "transform, opacity", zIndex: 1000 }}
        className={`absolute inset-0 rounded-2xl flex items-center justify-center shadow-xl lg-tile ${iconBg}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
