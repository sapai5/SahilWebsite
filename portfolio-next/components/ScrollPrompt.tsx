"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValueEvent, MotionValue } from "framer-motion";

export default function ScrollPrompt({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Re-arm a 1 s inactivity timer; when it fires, show the prompt as long as
    // we're not at the very end of the hero scroll.
    const scheduleShow = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (scrollYProgress.get() < 0.95) setVisible(true);
        }, 1000);
    }, [scrollYProgress]);

    // Initial inactivity timer (covers frame 0).
    useEffect(() => {
        scheduleShow();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [scheduleShow]);

    // Any scroll hides the prompt and restarts the inactivity countdown, so it
    // reappears after 1 s of stillness anywhere in the hero — not just at frame 0.
    useMotionValueEvent(scrollYProgress, "change", () => {
        setVisible(false);
        scheduleShow();
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
                {/* Liquid-glass pill — matches the site's buttons */}
                <div className="relative flex items-center gap-2.5 px-5 py-3 rounded-full lg-glass lg-glass-hover">
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
                        className="w-3.5 h-3.5 text-white/70 relative"
                    >
                        <path d="M3 5.5l5 5 5-5" />
                    </motion.svg>

                    {/* Label */}
                    <span className="relative text-[11px] tracking-[0.18em] uppercase text-white/65 font-medium">
                        Start scrolling
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
