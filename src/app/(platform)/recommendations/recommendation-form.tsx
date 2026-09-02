"use client";

import { useState, useTransition } from "react";
import { StarIcon } from "@/components/icons/app-icons";
import { submitRecommendation, type RecommendationFormData } from "@/actions/recommendation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RecommendationFormProps {
  defaultRole?: string | null;
}

export function RecommendationForm({ defaultRole }: RecommendationFormProps) {
  const [stars, setStars] = useState(5);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const data: RecommendationFormData = {
      text: String(formData.get("text") || ""),
      stars,
      role: String(formData.get("role") || ""),
    };

    startTransition(async () => {
      const result = await submitRecommendation(data);

      if (result.success) {
        form.reset();
        setStars(5);
        setMessage({
          type: "success",
          text: "Thank you. Your recommendation is now waiting for admin review.",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recommendation-text">Your recommendation</Label>
        <Textarea
          id="recommendation-text"
          name="text"
          required
          minLength={40}
          maxLength={1000}
          rows={8}
          className="resize-none text-base sm:text-sm"
          placeholder="Share the specific shift Suits & Stories helped you make: clearer pitch, stronger executive narrative, better investor room, sharper interview story..."
        />
        <p className="text-xs text-muted-foreground">
          Approved recommendations may appear on the public marketing site.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStars(value)}
              className="rounded-full p-1.5 transition hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
            >
              <StarIcon
                className={cn(
                  "h-7 w-7 transition",
                  value <= stars ? "text-amber-400" : "text-muted"
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{stars}.0</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendation-role">Display role or company</Label>
        <Input
          id="recommendation-role"
          name="role"
          defaultValue={defaultRole || ""}
          maxLength={120}
          className="text-base sm:text-sm"
          placeholder="e.g., CEO, AfyaAI Lab"
        />
      </div>

      {message && (
        <div
          className={cn(
            "rounded-lg p-3 text-sm",
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-500"
          )}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="min-h-11 w-full rounded-full sm:w-auto">
        {isPending ? "Submitting..." : "Submit for review"}
      </Button>
    </form>
  );
}
