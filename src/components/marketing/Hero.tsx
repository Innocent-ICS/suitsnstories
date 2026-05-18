import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Spiral } from "@/components/ui/spiral";

export function Hero() {


    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
            {/* Subtle Texture/Grid Background - Professional & Premium */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            <Spiral />

            <div className="container relative z-10 px-4 text-center max-w-4xl mx-auto space-y-8 md:space-y-12 pt-20">
                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-foreground leading-[1.1] md:leading-[1.1]">
                        Stories That <span className="text-muted-foreground italic">Win Belief.</span>
                    </h1>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-primary font-medium">
                        Connect & Convict
                    </h2>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans font-light">
                        We equip founders and executives with the narrative tools to close deals, raise capital, and command the room.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="rounded-md text-base px-8 h-12 shadow-sm">
                        <Link href="/contact">Request a Conversation</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-md text-base px-8 h-12 bg-background hover:bg-muted"
                    >
                        <Link href="/methodology">Our Methodology</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
