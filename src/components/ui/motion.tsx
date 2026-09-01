
"use client";

import { motion, UseInViewOptions, type Variants } from "framer-motion";

type FadeInProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    yOffset?: number;
    viewport?: UseInViewOptions;
};

export function FadeIn({
    children,
    className,
    delay = 0,
    duration = 0.5,
    yOffset = 24,
    viewport = { once: true, margin: "-50px" }
}: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function FadeInStagger({
    children,
    className,
    faster = false
}: {
    children: React.ReactNode;
    className?: string;
    faster?: boolean;
}) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ staggerChildren: faster ? 0.1 : 0.2 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const fadeInItem: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};
