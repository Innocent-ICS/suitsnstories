
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons/app-icons";
import { cn } from "@/lib/utils";

export const Carousel3D = ({
    items,
    autoPlay = true,
    interval = 5000,
}: {
    items: React.ReactNode[];
    autoPlay?: boolean;
    interval?: number;
}) => {
    const [index, setIndex] = useState(0);
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        if (!autoPlay || hovering) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, hovering, items.length]);

    const next = () => setIndex((prev) => (prev + 1) % items.length);
    const prev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

    return (
        <div
            className="relative flex flex-col items-center justify-center w-full min-h-[450px]"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div className="relative w-full max-w-5xl h-[350px] flex items-center justify-center perspective-1000">
                {items.map((item, i) => {
                    // Determine position relative to current index
                    const offset = (i - index + items.length) % items.length;

                    // Adjust offset for cleaner logic (centering 0)
                    // For 3 items: 0 is center, 1 is right, 2 is left (-1)
                    // For 5 items: 0 is center, 1 is right, 4 is left (-1), others hidden/side

                    let position = offset;
                    if (offset > items.length / 2) {
                        position = offset - items.length; // Convert e.g. 2 in array of 3 to -1
                    }

                    // We only show active, left, and right clearly. Others faded in back.
                    const isActive = position === 0;
                    const isRight = position === 1;
                    const isLeft = position === -1;

                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                x: isActive ? "0%" : isRight ? "60%" : isLeft ? "-60%" : position > 0 ? "120%" : "-120%",
                                scale: isActive ? 1 : 0.8,
                                zIndex: isActive ? 10 : 5,
                                opacity: isActive ? 1 : 0.5,
                                rotateY: isActive ? 0 : isRight ? -15 : isLeft ? 15 : 0,
                                filter: isActive ? "blur(0px)" : "blur(2px)",
                            }}
                            transition={{
                                duration: 0.8,
                                ease: [0.16, 1, 0.3, 1], // Custom bezier for very smooth "apple-like" motion
                            }}
                            className={cn(
                                "absolute w-[300px] md:w-[380px] p-8 rounded-2xl flex flex-col justify-between h-[320px] transition-all",
                                // Glassy Effect
                                "bg-background/40 backdrop-blur-xl border border-white/10 shadow-2xl",
                                "cursor-pointer"
                            )}
                            onClick={() => {
                                if (isRight) next();
                                if (isLeft) prev();
                            }}
                        >
                            {item}

                            {/* Shine/Reflection effect for extra glassiness */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex gap-6 mt-8 z-20">
                <button
                    onClick={prev}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors text-foreground/80 hover:text-foreground"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={next}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors text-foreground/80 hover:text-foreground"
                >
                    <ArrowRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
