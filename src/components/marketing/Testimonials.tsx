"use client";

import { useState, useEffect, useRef } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { testimonials } from "@/data/testimonials";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// We duplicate the testimonials to create a seamless infinite loop.
// [Before Buffer] [Original] [After Buffer]
// However, since the list is short (4 items), a simple triple duplication is safest.
// Or even simpler: Let's create a visual list that is [CloneEnd, ...Originals, CloneStart]
// But with 3 items visible, we need at least 3 clones at each end.
// Given 4 items:
// We will just render [...testimonials, ...testimonials, ...testimonials] (12 items)
// And cycle through index 4 to 7 (the middle set).
// Actually, to support sliding properly, we can just use a large enough cycle.
// Let's use flexible cycling.

export function Testimonials() {
    const [itemsPerPage, setItemsPerPage] = useState(3);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // We need enough items to scroll smoothly.
    // With 4 items, let's create a buffer.
    // Extended List: [...testimonials (clone), ...testimonials (main), ...testimonials (clone)]
    // This gives 4+4+4 = 12 items.
    // Main items are at indices 4, 5, 6, 7.
    const extendedTestimonials = [
        ...testimonials,
        ...testimonials,
        ...testimonials,
    ];

    // Start at the beginning of the "main" set.
    // Index 0 in main set is index `testimonials.length` in extended set.
    const START_INDEX = testimonials.length;

    // Initialize to start index
    useEffect(() => {
        setCurrentIndex(START_INDEX);
    }, []); // Run once on mount

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setItemsPerPage(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(3);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    };

    // Auto-slide
    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, isTransitioning]); // Dep on isTransitioning helps avoid spam

    // Handle Loop Logic (Transition End)
    useEffect(() => {
        if (!isTransitioning) return;

        const transitionDuration = 500; // matching CSS duration
        const timer = setTimeout(() => {
            setIsTransitioning(false);

            // Check for boundaries and snap
            const totalOriginal = testimonials.length;

            // If we moved past the end of the main set:
            // Main set ends at START_INDEX + totalOriginal - 1.
            // If currentIndex >= START_INDEX + totalOriginal, snap back.
            if (currentIndex >= START_INDEX + totalOriginal) {
                // Snap to the equivalent position in the start set (or main set) relative to the end.
                // Actually, just snap to (currentIndex - totalOriginal).
                // Example: If at index 8 (start of 3rd set), snap to index 4 (start of 2nd set).
                setCurrentIndex((prev) => prev - totalOriginal);
            }
            // If we moved before the start of the main set:
            else if (currentIndex < START_INDEX) {
                // Snap forward
                setCurrentIndex((prev) => prev + totalOriginal);
            }
        }, transitionDuration);

        return () => clearTimeout(timer);
    }, [currentIndex, isTransitioning]);

    // Calculate generic transform percentage
    // We want to shift by `currentIndex * (100 / itemsPerPage)` percent
    // But wait, since we are inside a flex container, we can just shift the track.
    // Width of one item is 100/itemsPerPage %.
    // TranslateX = -(currentIndex * 100 / itemsPerPage)%

    return (
        <section className="py-24 bg-background overflow-hidden relative group">
            <div className="container px-4 mx-auto">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-3 block">
                        Testimonial
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">
                        What some of Our Clients say
                    </h2>
                </div>

                <div className="relative max-w-7xl mx-auto">
                    {/* Navigation Buttons */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 md:-left-12 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md hover:bg-muted transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        aria-label="Previous testimonial"
                        disabled={isTransitioning}
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-foreground" />
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-4 md:-right-12 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md hover:bg-muted transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        aria-label="Next testimonial"
                        disabled={isTransitioning}
                    >
                        <ChevronRightIcon className="w-5 h-5 text-foreground" />
                    </button>

                    {/* Carousel Viewport */}
                    <div className="overflow-hidden w-full">
                        {/* Sliding Track */}
                        <div
                            ref={trackRef}
                            className="flex transition-transform duration-500 ease-in-out will-change-transform"
                            style={{
                                transform: `translate3d(-${currentIndex * (100 / itemsPerPage)}%, 0, 0)`,
                                // Use transition only when transitioning, but we handle that with 'isTransitioning' state logic elsewhere? 
                                // No, CSS transition is always active, but when we SNAP, we need to disable it.
                                // Wait, Reconcilation might animate the snap if we are not careful.
                                // To SNAP without animation, we must remove the transition class momentarily.
                                transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none'
                            }}
                        >
                            {extendedTestimonials.map((testimonial, index) => (
                                <div
                                    key={`${testimonial.id}-${index}`}
                                    className="flex-shrink-0 px-4"
                                    style={{ width: `${100 / itemsPerPage}%` }}
                                >
                                    <div className={cn(
                                        "p-8 rounded-2xl border flex flex-col justify-between h-full bg-card min-h-[320px]",
                                        testimonial.featured
                                            ? "border-primary ring-1 ring-primary/20 shadow-md"
                                            : "border-border hover:border-primary/50 transition-colors"
                                    )}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-6">
                                                <StarIcon className="w-6 h-6 text-amber-400" />
                                                <span className="font-semibold text-lg">{testimonial.stars.toFixed(1)}</span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed mb-8 italic">
                                                &quot;{testimonial.text}&quot;
                                            </p>
                                        </div>

                                        <div className="border-t border-border pt-6 flex items-center gap-4">
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                                                <Image
                                                    src={testimonial.image}
                                                    alt={testimonial.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">
                                                    {testimonial.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {testimonial.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Indicators - Mapped to ORIGINAL length */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, idx) => {
                            // Determine active state based on wrapped current index
                            // relative index = (currentIndex - START_INDEX) % length
                            // But currentIndex can be negative conceptually if we allow it, but here we clamped.

                            let relativeIndex = (currentIndex - START_INDEX) % testimonials.length;
                            if (relativeIndex < 0) relativeIndex += testimonials.length;

                            return (
                                <button
                                    key={idx}
                                    // On click, we want to jump to the corresponding item in the main set
                                    onClick={() => {
                                        if (isTransitioning) return;
                                        setCurrentIndex(START_INDEX + idx);
                                    }}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        idx === relativeIndex
                                            ? "w-8 bg-primary"
                                            : "w-2 bg-border hover:bg-primary/50"
                                    )}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            );
                        })}
                    </div>

                </div>
            </div>
        </section>
    );
}
