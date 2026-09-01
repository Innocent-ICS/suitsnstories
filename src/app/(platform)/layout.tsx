import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/platform/sidebar";
import { Topbar } from "@/components/platform/topbar";
import { MobileBottomNav } from "@/components/platform/mobile-bottom-nav";
import type { UserRole } from "@/types/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch user with role from database
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true, image: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const role = user.role as UserRole;

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-background">
      <Sidebar role={role} userName={user.name} />
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        <Topbar
          userName={user.name}
          userEmail={user.email}
          userRole={role}
          userImage={user.image}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
