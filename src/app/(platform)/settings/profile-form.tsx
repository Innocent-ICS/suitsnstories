"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileFormData } from "@/actions/profile";

interface ProfileFormProps {
  initialData: ProfileFormData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const data: ProfileFormData = {
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      company: formData.get("company") as string,
      industry: formData.get("industry") as string,
      linkedinUrl: formData.get("linkedinUrl") as string,
      timezone: formData.get("timezone") as string,
    };

    try {
      const result = await updateProfile(data);
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully." });
      } else {
        setMessage({ type: "error", text: result.error || "Something went wrong." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData.name}
          required
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initialData.bio}
          rows={3}
          className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="Tell us about yourself and your pitch goals..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            defaultValue={initialData.company}
            className="mt-1.5"
            placeholder="Your company or venture"
          />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            name="industry"
            defaultValue={initialData.industry}
            className="mt-1.5"
            placeholder="e.g., HealthTech, FinTech"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            defaultValue={initialData.linkedinUrl}
            className="mt-1.5"
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <TimezoneSelect
            defaultValue={initialData.timezone || ""}
          />
        </div>
      </div>

      {message && (
        <div
          className={`text-sm p-3 rounded-lg ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

function TimezoneSelect({ defaultValue }: { defaultValue: string }) {
  const [timezones] = useState<string[]>(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // Fallback for older browsers
      return [
        "Africa/Accra", "Africa/Lagos", "Africa/Nairobi", "Africa/Cairo",
        "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
        "America/Sao_Paulo", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo",
        "Australia/Sydney", "Europe/London", "Europe/Paris", "Europe/Berlin",
        "Pacific/Auckland", "UTC",
      ];
    }
  });

  const detected = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);

  const selectedValue = defaultValue || detected || "UTC";

  return (
    <select
      id="timezone"
      name="timezone"
      defaultValue={selectedValue}
      className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="" disabled>
        Select your timezone...
      </option>
      {timezones.map((tz) => (
        <option key={tz} value={tz}>
          {tz.replace(/_/g, " ")}
          {tz === detected ? " (detected)" : ""}
        </option>
      ))}
    </select>
  );
}
