
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/ContactForm";

export function ContactSection() {
    const [showForm, setShowForm] = useState(false);

    return (
        <section id="contact" className="py-24 bg-muted/20 border-t border-border transition-all duration-500 ease-in-out">
            <div className="container px-4 mx-auto text-center">
                {!showForm ? (
                    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-8">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-6">Request a Conversation</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light leading-relaxed">
                                Narrative clarity for the rooms that matter.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                            <Button
                                size="lg"
                                onClick={() => setShowForm(true)}
                                className="px-8 shadow-sm text-base"
                            >
                                Request a Conversation
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-8 bg-background hover:bg-muted text-base"
                            >
                                Learn More
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-20">
                        <ContactForm onCancel={() => setShowForm(false)} />
                    </div>
                )}
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <footer className="bg-muted/20 border-t border-border py-8">
            <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground/60">
                <p>© 2026 Suits & Stories. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
                    <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                    <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
                </div>
            </div>
        </footer>
    );
}

// Keeping the original export for backward compatibility if needed, but composed
export function ContactAndFooter() {
    return (
        <>
            <ContactSection />
            <Footer />
        </>
    )
}
