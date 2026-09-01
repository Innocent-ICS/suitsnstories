"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  AcademicCapIcon,
  FolderIcon,
  CalendarIcon,
  Cog6ToothIcon,
  UsersIcon,
  DocumentTextIcon,
  InboxIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { StethoscopeIcon } from "@/components/icons/stethoscope-icon";
import type { UserRole } from "@/types/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip?: string;
}

const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Perceptoscope", href: "/diagnostic", icon: StethoscopeIcon, tooltip: "AI-powered pitch deck analysis — get scored on story clarity, investor readiness, and visual design" },
  { label: "Recommend", href: "/recommendations", icon: ChatBubbleLeftRightIcon },
];

const programManagerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Programs", href: "/programs", icon: RocketLaunchIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Recommend", href: "/recommendations", icon: ChatBubbleLeftRightIcon },
];

const coachNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Recommend", href: "/recommendations", icon: ChatBubbleLeftRightIcon },
];

const engineerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Recommend", href: "/recommendations", icon: ChatBubbleLeftRightIcon },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  { label: "Programs", href: "/programs", icon: RocketLaunchIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Perceptoscope", href: "/diagnostic", icon: StethoscopeIcon, tooltip: "AI-powered pitch deck analysis — get scored on story clarity, investor readiness, and visual design" },
  { label: "AI Security", href: "/perceptoscope-security", icon: ShieldCheckIcon },
  { label: "Content", href: "/content", icon: DocumentTextIcon },
  { label: "Services", href: "/services-admin", icon: CalendarIcon },
  { label: "Users", href: "/clients", icon: UsersIcon },
  { label: "Inquiries", href: "/inquiries", icon: InboxIcon },
  { label: "Recommendations", href: "/recommendations-admin", icon: ChatBubbleLeftRightIcon },
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

/*
 * Visual Elevation Codex — Principle X: Sidebar as Navigation + Identity
 *
 * Three-state nav system: inactive (40% opacity) → hover (70%) → active (full purple + edge indicator)
 * Logo mark uses a coloured tile to establish brand presence
 * Active item has a right-edge purple accent border
 * 0.5px whisper border between sidebar and content (Principle III)
 */
export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);

  return (
    <aside
      className="hidden md:flex md:w-60 md:flex-col"
      style={{
        backgroundColor: "var(--surface-1)",
        borderRight: "0.5px solid var(--border-whisper)",
      }}
    >
      {/* Logo — Identity (Principle X) */}
      <div
        className="flex h-14 items-center gap-2.5 px-5"
        style={{ borderBottom: "0.5px solid var(--border-whisper)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "linear-gradient(135deg, #9333ea, #a78bfa)" }}
          >
            <Image
              src="/images/logo-dark.png"
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
          </div>
          <span className="text-[13px] font-medium" style={{ color: "var(--foreground)", opacity: 0.85 }}>
            Suits & Stories
          </span>
        </Link>
      </div>

      {/* Navigation — Map (Principle X) */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.tooltip}
                  className="group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors"
                  style={{
                    color: isActive
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
                    backgroundColor: isActive
                      ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--foreground)";
                      e.currentTarget.style.backgroundColor = "var(--surface-overlay)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--muted-foreground)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Active indicator — right-edge purple accent (Principle X) */}
                  {isActive && (
                    <span
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings — bottom fixed */}
      <div className="px-2.5 py-3" style={{ borderTop: "0.5px solid var(--border-whisper)" }}>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors"
          style={{
            color: pathname === "/settings" ? "var(--primary)" : "var(--muted-foreground)",
            backgroundColor: pathname === "/settings"
              ? "color-mix(in srgb, var(--primary) 8%, transparent)"
              : "transparent",
          }}
        >
          <Cog6ToothIcon className="h-[18px] w-[18px] shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
