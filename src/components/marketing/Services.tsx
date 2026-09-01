"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { FadeIn, FadeInStagger, fadeInItem } from "@/components/ui/motion";
import { motion } from "framer-motion";

export function Services() {
    return (
        <section id="services" className="py-24 bg-background relative overflow-hidden border-t border-white/10">
            <div className="container px-4 mx-auto relative z-10">
                <FadeIn className="max-w-4xl mx-auto text-center mb-20 space-y-8">
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">Our Services</h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                        Select the path that fits your needs.
                    </p>
                </FadeIn>

                {/* Booking / Enrollment Section */}
                <div className="max-w-6xl mx-auto">
                    <FadeInStagger className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* 1. Self-Paced Course — Featured */}
                        <motion.div variants={fadeInItem} className="relative p-8 rounded-3xl bg-card border-2 border-primary/40 hover:border-primary/60 transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/5 flex flex-col h-full">

                            {/* Popular badge — inline */}
                            <div className="absolute -top-3 right-6">
                                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                                    Free preview available
                                </span>
                            </div>

                            {/* Header & Price */}
                            <div className="mb-6 space-y-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">For Individuals</span>
                                    <h4 className="text-xl font-serif font-medium text-foreground mt-2">Self-Paced Course</h4>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-foreground">GH₵490</span>
                                    <span className="text-sm text-muted-foreground font-medium">/ one-time</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Master the 4-Fractal Pitch methodology at your own pace with video lessons, templates, and case studies.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="mb-8 space-y-2.5">
                                <Button className="w-full rounded-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all hover:scale-[1.02]" asChild>
                                    <Link href="/learn">Enroll Now</Link>
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    Preview select lessons at no cost — no card needed
                                </p>
                            </div>

                            {/* Features */}
                            <div className="mt-auto space-y-4 pt-6 border-t border-border/50">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Includes:</p>
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <ListItem>Lifetime access to all modules</ListItem>
                                    <ListItem>Pitch deck templates</ListItem>
                                    <ListItem>Narrative workbook</ListItem>
                                    <ListItem>Real startup case studies</ListItem>
                                </ul>
                            </div>
                        </motion.div>

                        {/* 2. Company Workshops */}
                        <motion.div variants={fadeInItem} className="relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col h-full ring-1 ring-primary/5">

                            {/* Special Tag if needed, or just let it be the 'Recommended' style visually */}

                            {/* Header & Price */}
                            <div className="mb-6 space-y-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">For Companies</span>
                                    <h4 className="text-xl font-serif font-medium text-foreground mt-2">Company Workshops</h4>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-muted-foreground font-medium">Starting at</span>
                                    <span className="text-4xl font-bold text-foreground">GH₵5000</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Live, high-impact workshops for teams preparing for fundraises or pivots.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="mb-8 space-y-2.5">
                                <Button className="w-full rounded-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all hover:scale-[1.02]" asChild>
                                    <a href="#contact">Plan a Workshop</a>
                                </Button>
                            </div>

                            {/* Features */}
                            <div className="mt-auto space-y-4 pt-6 border-t border-border/50">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Workshop features:</p>
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <ListItem>Tailored to your industry</ListItem>
                                    <ListItem>Team narrative alignment</ListItem>
                                    <ListItem>Real-time feedback & iteration</ListItem>
                                    <ListItem>In-person or virtual delivery</ListItem>
                                </ul>
                            </div>
                        </motion.div>

                        {/* 3. Accelerator Workshops */}
                        <motion.div variants={fadeInItem} className="relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col h-full">

                            {/* Header & Price */}
                            <div className="mb-6 space-y-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">For Incubators</span>
                                    <h4 className="text-xl font-serif font-medium text-foreground mt-2">Accelerator Workshops</h4>
                                </div>
                                <div>
                                    <span className="text-3xl font-bold text-foreground">Custom</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Scalable narrative training for cohorts. Equip founders with a shared framework.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="mb-8 space-y-2.5">
                                <Button variant="outline" className="w-full rounded-full h-11 text-sm font-semibold border-border hover:bg-muted hover:border-primary/50 font-sans transition-all hover:scale-[1.02]" asChild>
                                    <a href="#contact">Explore Partnership</a>
                                </Button>
                            </div>

                            {/* Features */}
                            <div className="mt-auto space-y-4 pt-6 border-t border-border/50">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Program features:</p>
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <ListItem>Cohort-based training</ListItem>
                                    <ListItem>Office hours access</ListItem>
                                    <ListItem>Demo Day preparation</ListItem>
                                    <ListItem>Enduring founder frameworks</ListItem>
                                </ul>
                            </div>
                        </motion.div>
                    </FadeInStagger>

                    {/* Diagnostic CTA */}
                    <FadeIn delay={0.4} className="mt-20 text-center space-y-6">
                        <p className="text-lg text-muted-foreground font-light">
                            Not sure which path fits you? <span className="block md:inline text-foreground font-medium">Start with a 30-minute Pitch Diagnostic.</span>
                        </p>
                        <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/5 group text-lg" asChild>
                            <Link href="/diagnostic">
                                Get a Pitch Diagnosis <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

function ListItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-primary shrink-0" />
            <span>{children}</span>
        </li>
    );
}
