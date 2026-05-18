"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  AcademicCapIcon,
  BeakerIcon,
  FolderIcon,
  CalendarIcon,
  Cog6ToothIcon,
  UsersIcon,
  DocumentTextIcon,
  InboxIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { UserRole } from "@/types/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Narratometer", href: "/diagnostic", icon: BeakerIcon },
];

const programManagerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Programs", href: "/programs", icon: RocketLaunchIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
];

const coachNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
];

const engineerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Programs", href: "/programs", icon: RocketLaunchIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Narratometer", href: "/diagnostic", icon: BeakerIcon },
  { label: "AI Security", href: "/narratometer-security", icon: ShieldCheckIcon },
  { label: "Content", href: "/content", icon: DocumentTextIcon },
  { label: "Services", href: "/services-admin", icon: CalendarIcon },
  { label: "Users", href: "/clients", icon: UsersIcon },
  { label: "Inquiries", href: "/inquiries", icon: InboxIcon },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "ADMIN":
      return adminNav;
    case "PROGRAM_MANAGER":
      return programManagerNav;
    case "COACH":
      return coachNav;
    case "PERCEPTION_ENGINEER":
      return engineerNav;
    default:
      return clientNav;
  }
}

interface SidebarProps {
  role: UserRole;
  userName?: string | null;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/images/logo-light.png"
            alt="Suits & Stories"
            className="h-8 w-8 object-contain dark:hidden"
          />
          <img
            src="/images/logo-dark.png"
            alt="Suits & Stories"
            className="h-8 w-8 object-contain hidden dark:block"
          />
          <span className="text-sm font-medium text-foreground">
            Suits & Stories
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings link at bottom */}
      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Cog6ToothIcon className="h-5 w-5 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
