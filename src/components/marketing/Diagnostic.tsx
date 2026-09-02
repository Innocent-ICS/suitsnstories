"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon, XMarkIcon } from "@/components/icons/app-icons";
import { FadeIn } from "@/components/ui/motion";

export function Diagnostic() {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-4xl relative z-10 space-y-20">

                {/* Header */}
                <FadeIn className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-serif text-foreground">Pitch Diagnostic</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
                        Get clarity on what’s actually holding your pitch back.
                    </p>
                    <p className="text-muted-foreground italic max-w-2xl mx-auto pt-4 border-t border-border/40 mt-8">
                        &ldquo;Most pitches fail because the story is doing too much, too little, or the wrong thing at the wrong time.&rdquo;
                    </p>
                </FadeIn>

                {/* The Proposition: Is vs Is Not */}
                <FadeIn className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                        <h3 className="text-lg font-bold text-primary uppercase tracking-widest">What This Is</h3>
                        <ul className="space-y-3">
                            <ListItem icon={<CheckIcon className="w-5 h-5 text-primary" />}>Strategic narrative diagnosis</ListItem>
                            <ListItem icon={<CheckIcon className="w-5 h-5 text-primary" />}>Expert 4-Fractal assessment</ListItem>
                            <ListItem icon={<CheckIcon className="w-5 h-5 text-primary" />}>Identification of gaps & misalignment</ListItem>
                        </ul>
                    </div>
                    <div className="p-6 bg-muted/30 rounded-2xl border border-border space-y-4">
                        <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-widest">What It Is Not</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <ListItem icon={<XMarkIcon className="w-5 h-5" />}>A practice session</ListItem>
                            <ListItem icon={<XMarkIcon className="w-5 h-5" />}>Slide-by-slide critique</ListItem>
                            <ListItem icon={<XMarkIcon className="w-5 h-5" />}>Motivational coaching</ListItem>
                        </ul>
                    </div>
                </FadeIn>

                {/* Key Outcomes (Streamlined) */}
                <FadeIn className="space-y-8 text-center">
                    <h2 className="text-3xl font-serif text-foreground">What You&apos;ll Get</h2>
                    <div className="grid sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
                        <OutcomeCard>Identified core story fracture points</OutcomeCard>
                        <OutcomeCard>Diagnosis of value & problem framing</OutcomeCard>
                        <OutcomeCard>Critique of credibility & CTA clarity</OutcomeCard>
                        <OutcomeCard>Clear next steps (Fix, Pivot, or Verify)</OutcomeCard>
                    </div>
                </FadeIn>

                {/* Who This Is For */}
                <FadeIn className="space-y-8 text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-serif text-foreground">Ideal For</h2>
                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <Card title="High-Stakes Prep" desc="Investors, demo days, competitions." />
                        <Card title="Unsure Founders" desc="Iterating endlessly without conviction." />
                        <Card title="Cohort Members" desc="Accelerator or incubator participants." />
                        <Card title="Misaligned Teams" desc="Lacking a shared company narrative." />
                    </div>
                </FadeIn>

                {/* The Offer */}
                <div className="bg-foreground/5 rounded-3xl p-8 md:p-12 border border-foreground/10 text-center space-y-8">
                    <FadeIn space-y-6>
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-serif text-foreground">The Diagnostic</h2>
                            <p className="text-muted-foreground font-light">30 Minutes. One Session. No Obligation.</p>
                        </div>

                        <div className="py-6">
                            <div className="text-5xl font-serif text-foreground font-medium">$75</div>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            <Button size="lg" className="w-full h-12 text-lg rounded-full shadow-lg" asChild>
                                <a href="#contact">Get a Pitch Diagnosis</a>
                            </Button>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Limited weekly slots</p>
                        </div>

                        <div className="pt-8 border-t border-foreground/10 mt-8">
                            <p className="text-sm text-muted-foreground">
                                <span className="text-foreground font-medium">Next Steps:</span> If needed, continues into a Pitch Sprint or Retainer.
                            </p>
                        </div>
                    </FadeIn>
                </div>

            </div>
        </section>
    );
}

function ListItem({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-1 shrink-0">{icon}</span>
            <span>{children}</span>
        </li>
    );
}

function OutcomeCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border border-border/50">
            <CheckIcon className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{children}</span>
        </div>
    );
}

function Card({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-6 rounded-xl bg-foreground/5 border border-foreground/10 hover:border-primary/30 transition-colors">
            <h4 className="font-serif font-medium text-foreground text-lg mb-2">{title}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
