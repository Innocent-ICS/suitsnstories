"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourse } from "@/actions/course";
import { PlusIcon, XMarkIcon } from "@/components/icons/app-icons";

export function CreateCourseButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const price = Math.round(parseFloat(priceStr || "0") * 100); // Convert to cents

    try {
      const result = await createCourse({ title, slug, description, price });
      if (result.success) {
        setOpen(false);
        router.push(`/content/${result.courseId}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create course");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        New Course
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Create Course</h2>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              className="mt-1"
              placeholder="e.g., The 4-Fractal Pitch Mastery"
              onChange={(e) => {
                const slugInput = document.getElementById("slug") as HTMLInputElement;
                if (slugInput) slugInput.value = generateSlug(e.target.value);
              }}
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              className="mt-1"
              placeholder="the-4-fractal-pitch-mastery"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="A brief description of this course..."
            />
          </div>

          <div>
            <Label htmlFor="price">Price (GHS) — 0 for free</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
