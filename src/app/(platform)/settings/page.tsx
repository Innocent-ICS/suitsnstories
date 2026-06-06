import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import {
  ShieldCheckIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

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
          Manage your account, preferences, and public profile.
        </p>
      </div>

      {/* Account & Security Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-medium text-foreground">Account & Security</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your login credentials and account details.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Sign-in method</span>
            <span className="text-foreground capitalize">
              {user?.emailVerified ? "Email (verified)" : "OAuth provider"}
            </span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Role</span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {user?.role?.toLowerCase().replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
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

      {/* Preferences Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-medium text-foreground">Preferences</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Customize your experience on the platform.
            </p>
          </div>
        </div>

        <div className="grid gap-4 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Timezone</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Used for displaying booking times and notifications.
              </p>
            </div>
            <span className="text-muted-foreground text-xs">
              Set in Profile below ↓
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Email notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Booking confirmations, project updates, and coach feedback.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Profile Section (Public-facing) */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-medium text-foreground">Public Profile</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              This information is visible to coaches and collaborators.
            </p>
          </div>
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

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
          <div>
            <h2 className="text-lg font-medium text-foreground">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Irreversible actions for your account.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-background p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <button
            disabled
            className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive opacity-50 cursor-not-allowed"
          >
            Contact support
          </button>
        </div>
      </div>
    </div>
  );
}
