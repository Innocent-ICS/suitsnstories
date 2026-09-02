import { ClockIcon, LightBulbIcon, LifebuoyIcon } from "@/components/icons/app-icons";
import { Carousel3D } from "@/components/ui/carousel-3d";

export function Problem() {
    const cards = PROBLEM_CARDS.map((card, index) => (
        <div key={index} className="h-full flex flex-col">
            <div className="space-y-4 flex-1">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    {card.icon}
                </div>
                <div>
                    <h3 className="text-xl font-serif font-medium text-foreground">{card.name}</h3>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">{card.designation}</p>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">
                    {card.description}
                </p>
            </div>
        </div>
    ));



    return (
        <section className="py-24 bg-muted/30 dark:bg-background overflow-hidden main-content-section">
            <div className="container px-4 mx-auto">

                <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
                    <p className="text-xl md:text-3xl lg:text-4xl font-serif font-light leading-tight text-muted-foreground">
                        Many talented founders and professionals fail not because their ideas lack merit, but because they cannot translate them into <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-bold">narratives that move decision-makers to act.</span>
                    </p>
                    <p className="text-xl font-medium font-serif italic text-foreground pt-4">The Pitcher&apos;s Nightmare</p>
                </div>

                <div className="w-full flex items-center justify-center">
                    <Carousel3D items={cards} />
                </div>


            </div>
        </section>
    );
}

const PROBLEM_CARDS = [
    {
        name: "Attention Is Scarce",
        designation: "The Reality",
        icon: <ClockIcon className="w-6 h-6" />,
        description: "Investors and executives review hundreds of pitches. You have seconds to earn the right to be heard before they tune out."
    },
    {
        name: "Strong Ideas Overlooked",
        designation: "The Cost",
        icon: <LightBulbIcon className="w-6 h-6" />,
        description: "Brilliant innovation often dies in the room, not because the product failed, but because the story did not land."
    },
    {
        name: "Clarity Under Pressure",
        designation: "The Risk",
        icon: <LifebuoyIcon className="w-6 h-6" />,
        description: "In high-stakes moments, complexity is a liability. If you confuse them, you lose them. Ambiguity kills deals."
    },
];
