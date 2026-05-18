import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
  
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and account preferences.
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-foreground">Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This information helps us personalize your experience.
          </p>
        </div>

        <ProfileForm
          initialData={{
            name: user?.name || "",
            bio: user?.profile?.bio || "",
            company: user?.profile?.company || "",
            industry: user?.profile?.industry || "",
            linkedinUrl: user?.profile?.linkedinUrl || "",
            timezone: user?.profile?.timezone || "",
          }}
        />
      </div>

      {/* Account Info (read-only) */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">Account</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Role</span>
            <span className="text-foreground capitalize">
              {user?.role?.toLowerCase().replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Member since</span>
            <span className="text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
