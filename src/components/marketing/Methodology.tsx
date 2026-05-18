import { LightBulbIcon, Square3Stack3DIcon, UsersIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Methodology() {
    const steps = [
        {
            icon: LightBulbIcon, // Was Brain
            title: "Scale-Invariant Structure",
            description: "A fractal decision framework. Whether you have 30 seconds or 30 minutes, the core narrative structure remains the same."
        },
        {
            icon: UsersIcon,
            title: "The 4 Invariant Questions",
            description: "Mastering the only four questions every investor and decision-maker is subconsciously asking."
        },
        {
            icon: Square3Stack3DIcon, // Was Layers (3D stack is closer to layers)
            title: "The 4-Layer Pitch Cake",
            description: "A systematic method for building narrative density, from the simple core to complex nuance."
        },
        {
            icon: ShieldExclamationIcon, // Was ShieldAlert
            title: "Control Under Pressure",
            description: "The ability to compress, expand, and pivot your story in real-time without losing narrative integrity."
        }
    ];

    return (
        <section className="py-24 bg-muted/50 border-y border-border/40">
            <div className="container px-4 mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-4xl mb-6 text-foreground font-serif">How We Work</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed font-light">
                        Our approach is substance-first and outcome-driven.
                    </p>
                </div>

                {/* Feature: Build A Fractal */}
                <div className="mb-20">
                    <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 md:grid md:grid-cols-2 items-center">
                        <div className="relative h-64 md:h-96 w-full p-8 md:p-12 flex items-center justify-center bg-muted/20">
                            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                                <Image
                                    src="/images/fractal.png"
                                    alt="Fractal Methodology"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="p-8 md:p-12 space-y-6">
                            <h3 className="text-3xl md:text-4xl font-serif text-foreground font-medium">Build A Fractal</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed font-light">
                                Any good story is built so that the core ideas and themes can be shown at any level of detail. Each chapter, each sentence, each phrase mirrors the larger story. This allows you to scale your story for a 10-second pitch, a 5-minute presentation, or a full session without losing coherence.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="relative pl-8 md:pl-0 pt-0 md:pt-8 flex md:flex-col items-start md:items-center text-left md:text-center gap-6 group">
                        {/* Connector Line (Mobile) */}
                        <div className="absolute left-[11px] top-8 bottom-[-32px] w-[3px] bg-purple-600 dark:bg-purple-400 md:hidden" />
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-[11px] left-1/2 right-[-100%] h-[3px] bg-purple-600 dark:bg-purple-400 z-0" />

                        <div className="relative z-10 w-6 h-6 rounded-full bg-foreground flex items-center justify-center shrink-0 border border-background">
                            <div className="w-2 h-2 rounded-full bg-background" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-medium mb-2 text-foreground">Narrative Diagnosis</h3>
                            <p className="text-sm text-muted-foreground">Identifying what story is currently being told, intentionally or not.</p>
                        </div>
                    </div>

                    <div className="relative pl-8 md:pl-0 pt-0 md:pt-8 flex md:flex-col items-start md:items-center text-left md:text-center gap-6 group">
                        {/* Connector Line (Mobile) */}
                        <div className="absolute left-[11px] top-8 bottom-[-32px] w-[3px] bg-purple-600 dark:bg-purple-400 md:hidden" />
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-[11px] left-1/2 right-[-100%] h-[3px] bg-purple-600 dark:bg-purple-400 z-0" />

                        <div className="relative z-10 w-6 h-6 rounded-full bg-foreground flex items-center justify-center shrink-0 border border-background">
                            <div className="w-2 h-2 rounded-full bg-background" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-medium mb-2 text-foreground">Narrative Architecture</h3>
                            <p className="text-sm text-muted-foreground">Structuring clarity, stakes, proof, and momentum.</p>
                        </div>
                    </div>

                    <div className="relative pl-8 md:pl-0 pt-0 md:pt-8 flex md:flex-col items-start md:items-center text-left md:text-center gap-6 group">
                        {/* Connector Line (Mobile) */}
                        <div className="absolute left-[11px] top-8 bottom-[-32px] w-[3px] bg-purple-600 dark:bg-purple-400 md:hidden" />
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-[11px] left-1/2 right-[-100%] h-[3px] bg-purple-600 dark:bg-purple-400 z-0" />

                        <div className="relative z-10 w-6 h-6 rounded-full bg-foreground flex items-center justify-center shrink-0 border border-background">
                            <div className="w-2 h-2 rounded-full bg-background" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-medium mb-2 text-foreground">Audience Translation</h3>
                            <p className="text-sm text-muted-foreground">Aligning message with how specific decision-makers think.</p>
                        </div>
                    </div>

                    <div className="relative pl-8 md:pl-0 pt-0 md:pt-8 flex md:flex-col items-start md:items-center text-left md:text-center gap-6 group">
                        <div className="relative z-10 w-6 h-6 rounded-full bg-foreground flex items-center justify-center shrink-0 border border-background">
                            <div className="w-2 h-2 rounded-full bg-background" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-medium mb-2 text-foreground">Pressure Testing</h3>
                            <p className="text-sm text-muted-foreground">Stress-testing narratives against skepticism and constraints.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Button variant="outline" asChild className="rounded-full border-2 border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-300 dark:hover:bg-purple-900/20">
                        <a href="/methodology">Read Deep Dive: The Fractal Methodology</a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
