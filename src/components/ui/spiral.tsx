
"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const Spiral = () => {
    // Use a fixed set of particles arranged in a spiral
    // We'll create 3 arms of the spiral
    const particles = Array.from({ length: 30 }).map((_, i) => i);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 select-none">
            {/* Container rotating slowly */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="relative w-[800px] h-[800px]"
            >
                {particles.map((i) => {
                    const angle = (i / 30) * Math.PI * 4; // 2 turns
                    const radius = 100 + (i * 10); // Expanding radius
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <motion.div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary/40 blur-[1px]"
                            style={{
                                x,
                                y,
                            }}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.1,
                                ease: "easeInOut",
                            }}
                        />
                    )
                })}
                {/* Second arm offset by 120 deg (2pi/3) implicit via mapping or just duplicate rings */}
                {particles.map((i) => {
                    const angle = (i / 30) * Math.PI * 4 + (Math.PI * 2) / 3;
                    const radius = 100 + (i * 10);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <motion.div
                            key={`arm2-${i}`}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary/40 blur-[1px]"
                            style={{
                                x,
                                y,
                            }}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.1 + 1,
                                ease: "easeInOut",
                            }}
                        />
                    )
                })}
                {/* Third arm offset */}
                {particles.map((i) => {
                    const angle = (i / 30) * Math.PI * 4 + (Math.PI * 4) / 3;
                    const radius = 100 + (i * 10);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <motion.div
                            key={`arm3-${i}`}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary/40 blur-[1px]"
                            style={{
                                x,
                                y,
                            }}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.1 + 2,
                                ease: "easeInOut",
                            }}
                        />
                    )
                })}
            </motion.div>
        </div>
    );
};
