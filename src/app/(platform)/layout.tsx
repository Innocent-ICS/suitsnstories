import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/platform/sidebar";
import { Topbar } from "@/components/platform/topbar";
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
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} userName={user.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={user.name}
          userEmail={user.email}
          userRole={role}
          userImage={user.image}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
