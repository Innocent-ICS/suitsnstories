"use client";

import { LogoTicker } from "@/components/ui/logo-ticker";
import Image from "next/image";
import { FadeIn, FadeInStagger, fadeInItem } from "@/components/ui/motion";
import { motion } from "framer-motion";
import { LightBulbIcon, SparklesIcon, ScaleIcon, BoltIcon } from "@/components/icons/app-icons";

export function About() {
    return (
        <section id="about" className="py-24 bg-background relative overflow-hidden">
            <div className="container px-4 mx-auto space-y-32">

                {/* Founder Bio */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <FadeIn className="order-2 lg:order-1 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-serif text-foreground">Hello there!</h2>
                        <div className="space-y-6 text-muted-foreground leading-relaxed font-light text-lg">
                            <p>
                                My name is Innocent, and it is a pleasure to meet you. I am passionate about helping entrepreneurs and professionals tell their best stories when it counts the most.
                            </p>
                            <p>
                                I have personally seen how narrative is the single most powerful asset one can use to advance their career. From pitching to top Silicon Valley investors and winning to leading monumental national policy discussions in Zimbabwe, serving on international boards, and landing top global scholarships—my biggest takeaway is this: <span className="text-foreground font-medium">your story is your greatest asset.</span>
                            </p>
                            <p>
                                I believe you can use story to move key levers in your startup, your team, or your career. I am here to help you achieve that goal.
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn className="order-1 lg:order-2 relative aspect-[3/4] w-full max-w-sm mx-auto lg:ml-auto rounded-2xl overflow-hidden bg-muted border border-border/50 group">
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        <Image
                            src="/founder-transparent.png"
                            alt="Innocent Chikwanda"
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute bottom-6 left-6 z-20 text-white">
                            <h3 className="text-xl font-serif font-medium">Innocent Chikwanda</h3>
                            <p className="text-sm font-light text-white/80">Founder, Suits & Stories</p>
                        </div>
                    </FadeIn>
                </div>

                {/* Why Suits & Stories? */}
                <FadeIn className="max-w-4xl space-y-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-foreground">So, why Suits & Stories?</h2>
                    <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed font-light text-lg">
                        <div className="space-y-4">
                            <p>
                                <strong className="text-foreground font-medium block text-xl mb-2">Suits</strong> represent the rooms where consequential decisions are made—investment committees, boardrooms, interview panels, policy tables. These spaces demand a certain level of professional fluency and can be intimidating even to the most capable individuals.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <p>
                                <strong className="text-foreground font-medium block text-xl mb-2">Stories</strong> are the mechanism through which access becomes influence. They are how complex ideas become legible, how experience becomes credibility, and how uncertainty becomes conviction.
                            </p>
                            <p className="text-foreground font-medium italic pt-2">
                                Suits & Stories helps clients enter these rooms prepared—and speak in a way that changes outcomes.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* Philosophy Grid */}
                <div className="space-y-16">
                    <FadeIn className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-serif text-foreground mb-4">Our Philosophy</h2>
                        <p className="text-muted-foreground font-light">We believe narrative is a strategic discipline, not just a creative one.</p>
                    </FadeIn>

                    <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <PhilosophyItem
                            icon={<LightBulbIcon />}
                            title="Ideas Matter"
                            desc="Strong ideas deserve to be understood instantly."
                        />
                        <PhilosophyItem
                            icon={<BoltIcon />}
                            title="Clarity Wins"
                            desc="High-stakes rooms reward clarity, not just effort."
                        />
                        <PhilosophyItem
                            icon={<ScaleIcon />}
                            title="Strategic Art"
                            desc="Storytelling is a precision tool, not just fluff."
                        />
                        <PhilosophyItem
                            icon={<SparklesIcon />}
                            title="Skill Multiplier"
                            desc="Narrative amplifies every other talent you possess."
                        />
                    </FadeInStagger>
                </div>

                {/* Social Proof / Honors */}
                <FadeIn className="space-y-8 border-y border-border/40 py-16">
                    <div className="mx-auto max-w-2xl space-y-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Founder experience includes</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Honors, programs, competitions, scholarships, and communities that Innocent has received, won, advanced in, been selected for, or participated in.
                        </p>
                    </div>
                    <LogoTicker items={HONORS_ITEMS} speed="slow" />
                </FadeIn>

                {/* Core Aim */}
                <FadeIn className="max-w-3xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-foreground">Our Goal</h2>
                    <p className="text-muted-foreground text-lg font-light leading-relaxed">
                        &ldquo;To be the default partner for those who take narrative seriously—because the cost of getting it wrong is too high.&rdquo;
                    </p>
                </FadeIn>

            </div>
        </section>
    );
}

function PhilosophyItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <motion.div
            variants={fadeInItem}
            className="p-8 rounded-3xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 text-center space-y-6 group"
        >
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <div className="w-7 h-7">{icon}</div>
            </div>
            <div className="space-y-3">
                <h3 className="font-serif font-medium text-foreground text-xl">{title}</h3>
                <p className="text-muted-foreground leading-relaxed font-light">{desc}</p>
            </div>
        </motion.div>
    );
}

const HONORS_ITEMS = [
    "Ashesi University",
    "Berkeley SkyDeck",
    "Rhodes Scholarship",
    "Mastercard Foundation Scholarship",
    "26th Zimbabwe Junior President",
    "Hult Prize",
    "Coca-Cola Foundation",
    "SCET Berkeley",
    "Collider Cup XV",
    "Zimbabwe Junior Parliament",
    "Melton Foundation Board"
].map((item, idx) => (
    <span key={idx} className="text-xl md:text-2xl font-serif text-foreground/40 hover:text-foreground transition-colors cursor-default whitespace-nowrap mx-8">
        {item}
    </span>
));
