"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

interface ParallaxProps {
    children: ReactNode;
    className?: string;
    /** Max vertical drift in px as the element crosses the viewport. */
    drift?: number;
}

/**
 * Subtle vertical drift while scrolling past — the content moves
 * slightly slower than the page. Static under prefers-reduced-motion.
 */
export function Parallax({ children, className, drift = 24 }: ParallaxProps) {
    const ref = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

    return (
        <motion.div ref={ref} className={className} style={reduceMotion ? undefined : { y }}>
            {children}
        </motion.div>
    );
}
