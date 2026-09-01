
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

import { FadeIn, FadeInStagger, fadeInItem } from "@/components/ui/motion";
import { motion } from "framer-motion";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function OurWayContent() {
    return (
        <main className="flex-1 pt-24">
            {/* Hero Section */}
            <section className="container px-4 mx-auto max-w-4xl text-center space-y-8 mb-24">
                <FadeIn>
                    <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight mb-8 text-foreground">
                        The Anatomy of a <span className="italic text-primary">Winning Pitch</span>
                    </h1>
                </FadeIn>
                <FadeIn delay={0.2}>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                        At the core of our pedagogy is a philosophy that differentiates us from traditional storytelling. Not just telling your &ldquo;why&rdquo;, but showing it.
                    </p>
                </FadeIn>
            </section>

            {/* The Philosophy of Story */}
            <section className="py-20">
                <div className="container px-4 mx-auto max-w-5xl">
                    <PhilosophyCarousel />
                </div>
            </section>

            {/* How We Work Process */}
            <HowWeWork />

            {/* Core Techniques */}
            <section className="py-24">
                <div className="container px-4 mx-auto max-w-4xl space-y-16">
                    <FadeIn className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-serif text-foreground">Core Techniques</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We utilize proprietary frameworks to ensure narrative rigor and structural integrity.
                        </p>
                    </FadeIn>

                    <FadeInStagger className="grid md:grid-cols-2 gap-8">
                        <motion.div variants={fadeInItem}>
                            <Link href="/course-enroll" className="block h-full p-8 border border-border rounded-xl bg-card hover:border-primary/50 transition-colors space-y-4 cursor-pointer hover:shadow-md">
                                <h3 className="text-2xl font-serif font-medium text-foreground">The Four-Fractal Pitch</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Our proprietary framework for high-stakes pitching. It is scale-invariant, ensuring that the core decision-making logic remains coherent whether you have 10 seconds, 10 minutes, or an hour.
                                </p>
                            </Link>
                        </motion.div>
                        <motion.div variants={fadeInItem}>
                            <Link href="/course-enroll" className="block h-full p-8 border border-border rounded-xl bg-card hover:border-primary/50 transition-colors space-y-4 cursor-pointer hover:shadow-md">
                                <h3 className="text-2xl font-serif font-medium text-foreground">The 4-Layer Pitch Cake</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    A rigorous structural model used to build narrative density. Just as a cake relies on layers supporting one another, we teach founders how to stack their arguments so they are mathematically sound and resilient to scrutiny.
                                </p>
                            </Link>
                        </motion.div>
                    </FadeInStagger>
                </div>
            </section>

            {/* Why We Are Different */}
            <section className="py-24 bg-muted/20 border-t border-border">
                <div className="container px-4 mx-auto max-w-4xl space-y-12">
                    <FadeIn className="text-center">
                        <h2 className="text-3xl font-serif mb-4 text-foreground">Why We Are Different</h2>
                        <p className="text-muted-foreground uppercase tracking-widest text-sm font-medium">Distinctive Pedagogy</p>
                    </FadeIn>

                    <FadeInStagger className="grid md:grid-cols-2 gap-8">
                        <DiffCard title="Fractal Storytelling" desc="Unlike linear frameworks, our approach ensures scale-invariant persuasion. Every part mirrors the whole." />
                        <DiffCard title="Experiential, Not Declarative" desc="We focus on showing your why. Founders learn to put their audience in their shoes." />
                        <DiffCard title="Decision-Oriented" desc="Every pitch is organized around the questions investors actually care about." />
                        <DiffCard title="Dual-Framing Pedagogy" desc="We combine intellectual rigor with intuitive accessibility, ensuring the framework is grasped by all audiences." />
                    </FadeInStagger>
                </div>
            </section>

            {/* The Promise */}
            <section className="py-24 bg-background border-t border-border text-center">
                <div className="container px-4 mx-auto max-w-3xl space-y-8">
                    <h2 className="text-3xl font-serif text-foreground">The Promise</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed font-light">
                        Learners don’t just memorize a script. They internalize a fractal logic of story and pitch.
                        They can compress, expand, and translate their story across formats and audiences, creating lasting understanding and belief.
                    </p>
                    <Button size="lg" className="rounded-full px-8" asChild>
                        <Link href="/#contact">Start Your Journey</Link>
                    </Button>
                </div>
            </section>
        </main >
    );
}

function DiffCard({ title, desc }: { title: string, desc: string }) {
    return (
        <motion.div variants={fadeInItem} className="space-y-2">
            <h3 className="text-lg font-serif font-medium border-l-2 border-primary pl-4 text-foreground">{title}</h3>
            <p className="text-muted-foreground text-sm pl-4 leading-relaxed">{desc}</p>
        </motion.div>
    )
}

const HOW_WE_WORK_STEPS = [
    {
        title: "Narrative Diagnosis",
        description: "Identifying what story is currently being told, intentionally or not."
    },
    {
        title: "Narrative Architecture",
        description: "Structuring clarity, stakes, proof, and momentum."
    },
    {
        title: "Audience Translation",
        description: "Aligning message with how specific decision-makers think."
    },
    {
        title: "Pressure Testing",
        description: "Stress-testing narratives against skepticism and constraints."
    }
];

function HowWeWork() {
    return (
        <section className="py-24 bg-background">
            <div className="container px-4 mx-auto max-w-6xl">
                <FadeIn className="text-center space-y-4 mb-20">
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">How We Work</h2>
                    <p className="text-muted-foreground text-lg font-light">
                        Our approach is substance-first and outcome-driven.
                    </p>
                </FadeIn>

                <div className="relative">
                    {/* Horizontal Connector Line (Desktop) */}
                    {/* Spans from center of first item (12.5%) to center of last item (87.5%) */}
                    <div className="hidden md:block absolute top-[11px] left-[12.5%] right-[12.5%] h-px bg-primary/30" />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                        {HOW_WE_WORK_STEPS.map((step, index) => (
                            <FadeIn key={step.title} delay={0.1 * index} className="relative flex flex-col items-center text-center space-y-6">
                                {/* Dot Indicator */}
                                <div className="z-10 bg-background p-1 hidden md:block">
                                    <div className="w-4 h-4 rounded-full bg-background border-[3px] border-foreground ring-4 ring-background" />
                                </div>

                                <div className="space-y-3 pt-4">
                                    <h3 className="text-xl font-serif font-medium text-foreground">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[250px] mx-auto">
                                        {step.description}
                                    </p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>

                <FadeIn delay={0.4} className="mt-20 text-center">
                    <Button variant="outline" className="rounded-full px-8 border-white/20 hover:bg-white/5 text-foreground">
                        Read Deep Dive: The Fractal Methodology
                    </Button>
                </FadeIn>
            </div>
        </section>
    );
}

const PHILOSOPHY_STEPS = [
    {
        title: "Share Your Eyes",
        description: "Most storytelling advice tells you to explain your purpose. We do the opposite. A powerful story puts the audience in your position. They experience your decision-making, your challenges, and your triumphs.",
        quote: "\"A good story is like sharing a pair of eyes: the audience sees the world as you see it, and only then do they understand your why.\"",
        image: "/images/Cockpit.png",
        alt: "First person perspective cockpit view"
    },
    {
        title: "Build A Fractal",
        description: "Any good story is built so that the core ideas and themes can be shown at any level of detail. Each section, each beat, and even each scene mirrors the larger story. This allows you to scale your story for a 10-second pitch, a 5-minute presentation, or a full session without losing coherence.",
        quote: null,
        image: "/images/Fractal.png",
        alt: "Fractal storytelling visualization"
    }
];

function PhilosophyCarousel() {
    const [activeTab, setActiveTab] = useState(0);

    const handleNext = () => {
        setActiveTab((prev) => (prev + 1) % PHILOSOPHY_STEPS.length);
    };

    const handlePrev = () => {
        setActiveTab((prev) => (prev - 1 + PHILOSOPHY_STEPS.length) % PHILOSOPHY_STEPS.length);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 20000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col gap-8">
            {/* Tabs */}
            <div className="flex justify-center gap-8 md:gap-16 border-b border-white/10 pb-4">
                {PHILOSOPHY_STEPS.map((step, index) => (
                    <button
                        key={step.title}
                        onClick={() => setActiveTab(index)}
                        className={`text-xl md:text-2xl font-serif transition-colors duration-300 relative pb-4 -mb-4 ${activeTab === index ? "text-primary " : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {step.title}
                        {activeTab === index && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Carousel Content */}
            <div className="relative min-h-[500px] group">
                <button
                    onClick={handlePrev}
                    className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-sm"
                    aria-label="Previous slide"
                >
                    <ChevronLeftIcon className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <button
                    onClick={handleNext}
                    className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-sm"
                    aria-label="Next slide"
                >
                    <ChevronRightIcon className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-white/10 shadow-xl rounded-2xl p-8 md:p-12 w-full h-full"
                    >
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center h-full">
                            {/* Left: Image */}
                            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 h-64 md:h-96 w-full group order-1 md:order-1">
                                <div className="absolute inset-0 z-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none rounded-xl" />
                                <Image
                                    src={PHILOSOPHY_STEPS[activeTab].image}
                                    alt={PHILOSOPHY_STEPS[activeTab].alt}
                                    fill
                                    sizes="(min-width: 768px) 45vw, 100vw"
                                    className="object-cover opacity-90 transition-opacity"
                                />
                            </div>

                            {/* Right: Text */}
                            <div className="space-y-6 text-left order-2 md:order-2">
                                <h3 className="text-3xl md:text-4xl font-serif text-foreground">
                                    {PHILOSOPHY_STEPS[activeTab].title}
                                </h3>
                                <p className="text-lg md:text-xl font-light text-muted-foreground leading-relaxed">
                                    {PHILOSOPHY_STEPS[activeTab].description}
                                </p>
                                {PHILOSOPHY_STEPS[activeTab].quote && (
                                    <p className="text-lg font-light italic text-muted-foreground border-l-2 border-primary/50 pl-4 py-2 bg-white/5 rounded-r-lg">
                                        {PHILOSOPHY_STEPS[activeTab].quote}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
