"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { enrollInCourse } from "@/actions/enrollment";
import { initCoursePayment } from "@/actions/payment";

interface EnrollButtonProps {
  courseId: string;
  price: number;
}

export function EnrollButton({ courseId, price }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    try {
      if (price === 0) {
        // Free enrollment
        const result = await enrollInCourse(courseId);
        if (result.success) {
          router.refresh();
        } else {
          setError(result.error || "Enrollment failed");
        }
      } else {
        // Paid enrollment — open the native checkout first.
        const result = await initCoursePayment(courseId);
        if (result.success && result.checkoutUrl) {
          router.push(result.checkoutUrl);
          return;
        } else {
          setError(result.error || "Payment init failed");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleEnroll} disabled={loading} className="min-h-11 w-full rounded-xl px-5 font-semibold sm:w-auto">
        {loading
          ? "Processing..."
          : price === 0
            ? "Enroll Free"
            : `Enroll — GH₵${(price / 100).toFixed(0)}`}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
