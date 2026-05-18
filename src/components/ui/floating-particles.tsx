
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

export const FloatingParticles = ({
    className,
}: {
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "absolute inset-0 z-0 overflow-hidden pointer-events-none",
                className
            )}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className="relative w-full h-full"
            >
                {/* Particle 1 */}
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        x: [0, 10, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]"
                />

                {/* Particle 2 */}
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        x: [0, -20, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
                />

                {/* Particle 3 */}
                <motion.div
                    animate={{
                        y: [0, -40, 0],
                        opacity: [0.1, 0.4, 0.1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2,
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]"
                />
            </motion.div>
        </div>
    );
};
