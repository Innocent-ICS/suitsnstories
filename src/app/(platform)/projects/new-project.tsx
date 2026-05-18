"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/actions/project";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createProject({
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        brief: fd.get("brief") as string,
      });
      if (result.success) {
        setOpen(false);
        router.push(`/projects/${result.projectId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        New Project
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">New Pitch Project</h2>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project-title">Project Title</Label>
            <Input id="project-title" name="title" required className="mt-1" placeholder="e.g., Series A Pitch Deck" />
          </div>
          <div>
            <Label htmlFor="project-desc">Description</Label>
            <textarea
              id="project-desc"
              name="description"
              rows={2}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What's this project about?"
            />
          </div>
          <div>
            <Label htmlFor="project-brief">Pitch Brief</Label>
            <textarea
              id="project-brief"
              name="brief"
              rows={4}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Share your pitch context: audience, ask, key points..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Creating..." : "Create Project"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
