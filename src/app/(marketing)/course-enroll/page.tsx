import { Button } from "@/components/ui/button";

export default function CourseEnrollPage() {
  return (
    <div className="container px-4 mx-auto max-w-3xl text-center space-y-8 pt-8 pb-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-serif text-foreground">
          Suits &amp; Stories Academy
        </h1>
        <p className="text-xl text-muted-foreground font-light">
          The self-paced curriculum for high-stakes narrative strategy.
        </p>
      </div>

      <div className="p-12 border border-border rounded-xl bg-card shadow-sm space-y-6">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🎓</span>
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          Enrollment Opening Soon
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We are currently finalizing the curriculum for the upcoming cohort.
          Join the waitlist to be notified when enrollment opens and receive a
          sample module.
        </p>

        <div className="max-w-md mx-auto pt-6">
          <Button size="lg" className="w-full">
            Join Waitlist
          </Button>
        </div>
      </div>
    </div>
  );
}
