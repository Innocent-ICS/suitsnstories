"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DecisionPsychologyIcon,
    ProfessionalPowerIcon,
    StoryArchitectureIcon,
} from "@/components/icons/app-icons";
import { FadeIn } from "@/components/ui/motion";
import Image from "next/image";

const CLIENTS = [
    {
        title: "Early-Stage Founders",
        description: "Fundraising is chaotic. We bring order to your pitch by structuring your vision into a dependable narrative asset. We transform complex technologies and rough ideas into the clarity investors need to deploy capital with confidence.",
        image: "/images/carousel-founders.png",
        alt: "Founder pitching to investors"
    },
    {
        title: "High-Performing Professionals",
        description: "Career transitions require precision. We replace the anxiety of 'selling yourself' with a clear, strategic narrative that organizes your achievements into a compelling case for promotion, leadership, or elite selection.",
        image: "/images/carousel-professionals.jpg",
        alt: "Professional in an interview"
    },
    {
        title: "Executives and Senior Leaders",
        description: "Leadership demands clarity. We help you cut through the noise of complex strategies to deliver dependable, high-impact messages that align boards, inspire teams, and drive organizational action.",
        image: "/images/carousel-executives.png",
        alt: "Executive presenting strategy"
    },
];

export function WhatWeDo() {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % CLIENTS.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + CLIENTS.length) % CLIENTS.length);
    };

    // Auto-rotate
    useEffect(() => {
        const timer = setInterval(handleNext, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container px-4 mx-auto relative z-10">
                <FadeIn className="max-w-4xl mx-auto text-center mb-20 space-y-8">
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">What We Do</h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                        We translate complex ideas into high-impact conversations for founders, executives, and high-performing professionals. Through our carefully curated methodology and ecosystem of tools—including templates, AI assistants, courses, and dedicated coaching—we bring <span className="text-foreground font-medium">order, dependability, and clarity</span> to the chaos of storytelling.
                    </p>
                    <div className="space-y-6 text-muted-foreground leading-relaxed">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
                            <FeatureCard
                                title="Story Architecture"
                                description="We structure chaotic ideas into dependable narrative assets, ensuring every slide and sentence advances your strategic goal."
                                icon={<StoryArchitectureIcon className="w-6 h-6 text-primary" />}
                            />
                            <FeatureCard
                                title="Decision Psychology"
                                description="We engineer your core message to align with how investors and executives actually process information and make high-stakes choices."
                                icon={<DecisionPsychologyIcon className="w-6 h-6 text-primary" />}
                            />
                            <FeatureCard
                                title="Professional Power Dynamics"
                                description="We equip you with the verbal and non-verbal tools to command the room, control the frame, and navigate skepticism with authority."
                                icon={<ProfessionalPowerIcon className="w-6 h-6 text-primary" />}
                            />
                        </div>
                    </div>
                </FadeIn>

                {/* Carousel */}
                <div className="relative max-w-5xl mx-auto min-h-[500px]">
                    <div className="flex items-center justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 pointer-events-none px-2 md:px-0">
                        <button
                            onClick={handlePrev}
                            className="pointer-events-auto p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-sm"
                            aria-label="Previous slide"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="pointer-events-auto p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-sm"
                            aria-label="Next slide"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="relative h-full flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="w-full max-w-lg md:max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:border-primary/30 transition-colors"
                            >
                                {/* Image Section */}
                                <div className="h-64 md:h-96 relative bg-muted">
                                    <Image
                                        src={CLIENTS[activeIndex].image}
                                        alt={CLIENTS[activeIndex].alt}
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="p-8 md:p-10 space-y-6">
                                    <h3 className="text-2xl md:text-3xl font-serif text-foreground">{CLIENTS[activeIndex].title}</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed font-light">
                                        {CLIENTS[activeIndex].description}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-3 mt-8">
                        {CLIENTS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === activeIndex
                                    ? "bg-primary w-8"
                                    : "bg-white/20 hover:bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Closing Social Proof Paragraph */}
                <FadeIn className="max-w-4xl mx-auto text-center mt-24 pt-16 border-t border-border/50">
                    <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-6">Proven in High-Stakes Contexts</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed font-light">
                        Suits & Stories is informed by real-world experience across venture capital, public policy, global competitions, and elite selection environments. Our work has supported founders across Africa and globally, including startups within a Mastercard Foundation–funded healthtech incubator, several of whom have gone on to secure funding following narrative and pitch refinement.
                    </p>
                </FadeIn>
            </div>
        </section>
    );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
    return (
        <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h4 className="text-lg font-bold font-serif text-foreground mb-3 group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
            </p>
        </div>
    );
}
