"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const LogoTicker = ({
    items,
    direction = "left",
    speed = "normal",
    pauseOnHover = true,
    className,
}: {
    items: React.ReactNode[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const animationDirection = direction === "left" ? "forwards" : "reverse";
    const animationDuration = speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";
    const tickerItems = [...items, ...items];

    return (
        <div
            style={{
                "--animation-direction": animationDirection,
                "--animation-duration": animationDuration,
            } as React.CSSProperties}
            className={cn(
                "scroller relative z-20 overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
                className
            )}
        >
            <ul
                className={cn(
                    "flex min-w-full shrink-0 gap-16 py-4 w-max flex-nowrap animate-scroll",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {tickerItems.map((item, idx) => (
                    <li
                        className="w-max max-w-full relative flex-shrink-0 flex items-center"
                        key={idx}
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};
