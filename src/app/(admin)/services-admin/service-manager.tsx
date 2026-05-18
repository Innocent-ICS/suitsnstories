"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createService, updateService, deleteService } from "@/actions/booking";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface ServiceData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  isActive: boolean;
  bookingCount: number;
}

export function ServiceManager({ services }: { services: ServiceData[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <ServiceForm
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh(); }}
        />
      )}

      {/* Service list */}
      {services.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No services yet. Create your first one.</p>
        </div>
      ) : (
        services.map((service) => (
          <div key={service.id} className="rounded-xl border border-border bg-card">
            {editing === service.id ? (
              <ServiceForm
                service={service}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); router.refresh(); }}
              />
            ) : (
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{service.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${service.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {service.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {service.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {service.duration} min
                    </span>
                    <span>
                      {service.price === 0 ? "Free" : `GH₵${(service.price / 100).toFixed(0)}`}
                    </span>
                    <span>{service.bookingCount} bookings</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(service.id)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${service.title}"?`)) {
                        await deleteService(service.id);
                        router.refresh();
                      }
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service?: ServiceData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      slug: fd.get("slug") as string,
      description: fd.get("description") as string,
      duration: parseInt(fd.get("duration") as string),
      price: Math.round(parseFloat(fd.get("price") as string || "0") * 100),
      isActive: fd.get("isActive") === "on",
    };

    try {
      if (service) {
        await updateService(service.id, data);
      } else {
        await createService(data);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{service ? "Edit Service" : "New Service"}</h3>
        <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="svc-title">Title</Label>
          <Input
            id="svc-title"
            name="title"
            defaultValue={service?.title}
            required
            className="mt-1"
            placeholder="e.g., Pitch Diagnostic"
            onChange={(e) => {
              if (!service) {
                const slugEl = document.getElementById("svc-slug") as HTMLInputElement;
                if (slugEl) slugEl.value = generateSlug(e.target.value);
              }
            }}
          />
        </div>
        <div>
          <Label htmlFor="svc-slug">Slug</Label>
          <Input id="svc-slug" name="slug" defaultValue={service?.slug} required className="mt-1" />
        </div>
      </div>

      <div>
        <Label htmlFor="svc-desc">Description</Label>
        <textarea
          id="svc-desc"
          name="description"
          defaultValue={service?.description || ""}
          rows={2}
          className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="svc-duration">Duration (min)</Label>
          <Input
            id="svc-duration"
            name="duration"
            type="number"
            min="15"
            step="15"
            defaultValue={service?.duration || 60}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="svc-price">Price (GHS)</Label>
          <Input
            id="svc-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={service ? (service.price / 100).toFixed(2) : "0"}
            className="mt-1"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={service?.isActive ?? true}
              className="accent-primary"
            />
            Active
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving..." : service ? "Save" : "Create"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
