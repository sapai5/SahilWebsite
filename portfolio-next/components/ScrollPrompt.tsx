"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValueEvent, MotionValue } from "framer-motion";

export default function ScrollPrompt({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
    const [visible, setVisible] = useState(false);

    // Show after 3 s only if still at frame 0; hide the moment scrolling starts
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollYProgress.get() === 0) setVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [scrollYProgress]);

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        if (v > 0) setVisible(false);
    });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={!visible}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none"
            >
                {/* Outer pill */}
                <div className="relative flex items-center gap-2.5 px-5 py-3 rounded-full"
                    style={{
                        background: "rgba(255,255,255,0.25)",
                        backdropFilter: "blur(24px) saturate(200%)",
                        WebkitBackdropFilter: "blur(24px) saturate(200%)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06) inset",
                    }}
                >
                    {/* Pulsing glow behind the pill */}
                    <span
                        className="absolute inset-0 rounded-full animate-pulse"
                        style={{
                            background: "rgba(255,255,255,0.25)",
                            filter: "blur(8px)",
                            animationDuration: "2s",
                        }}
                    />

                    {/* Animated bouncing chevron */}
                    <motion.svg
                        animate={{ y: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5 text-black/50 relative"
                    >
                        <path d="M3 5.5l5 5 5-5" />
                    </motion.svg>

                    {/* Label */}
                    <span className="relative text-[11px] tracking-[0.18em] uppercase text-black/45 font-medium">
                        Start scrolling
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
