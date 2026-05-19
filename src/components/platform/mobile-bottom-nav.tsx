"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  ChatBubbleLeftRightIcon,
  RectangleGroupIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { StethoscopeIcon } from "@/components/icons/stethoscope-icon";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const defaultCenterItem: MobileNavItem = {
  label: "Percept",
  href: "/diagnostic",
  icon: StethoscopeIcon,
};

const baseTabs = (centerItem: MobileNavItem): MobileNavItem[] => [
  { label: "Home", href: "/dashboard", icon: HomeIcon },
  { label: "Projects", href: "/projects", icon: FolderIcon },
  centerItem,
  { label: "Learn", href: "/learn", icon: AcademicCapIcon },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
];

const adminManageItems: MobileNavItem[] = [
  { label: "Perceptoscope", href: "/diagnostic", icon: StethoscopeIcon },
  { label: "Programs", href: "/programs", icon: RocketLaunchIcon },
  { label: "Content", href: "/content", icon: DocumentTextIcon },
  { label: "Services", href: "/services-admin", icon: CalendarIcon },
  { label: "Users", href: "/clients", icon: UsersIcon },
  { label: "Inquiries", href: "/inquiries", icon: InboxIcon },
  { label: "Reviews", href: "/recommendations-admin", icon: ChatBubbleLeftRightIcon },
  { label: "AI Security", href: "/perceptoscope-security", icon: ShieldCheckIcon },
];

const managerManageItems: MobileNavItem[] = [
  { label: "Perceptoscope", href: "/diagnostic", icon: StethoscopeIcon },
  { label: "Programs", href: "/programs", icon: RocketLaunchIcon },
];

export function MobileBottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [manageOpen, setManageOpen] = useState(false);
  const hasManage = role === "ADMIN" || role === "PROGRAM_MANAGER";
  const manageItems = role === "ADMIN" ? adminManageItems : managerManageItems;
  const manageIsActive = manageItems.some((item) => isActivePath(pathname, item.href));
  const centerItem = hasManage
    ? { label: "Manage", href: "#manage", icon: Squares2X2Icon }
    : defaultCenterItem;
  const tabs = baseTabs(centerItem);

  return (
    <>
      {manageOpen && (
        <button
          type="button"
          aria-label="Close manage menu"
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setManageOpen(false)}
        />
      )}

      {hasManage && manageOpen && (
        <div className="fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 rounded-3xl border border-border bg-card/95 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Manage
              </p>
              <p className="text-sm text-muted-foreground">Admin and program tools</p>
            </div>
            <RectangleGroupIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {manageItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setManageOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-2xl border px-3 text-sm font-medium transition",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/90 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
          {tabs.map((item, index) => {
            const isCenter = index === 2;
            const active = hasManage && isCenter ? manageIsActive || manageOpen : isActivePath(pathname, item.href);

            if (hasManage && isCenter) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setManageOpen((open) => !open)}
                  aria-expanded={manageOpen}
                  className="group flex flex-col items-center gap-1 text-[0.68rem] font-semibold text-muted-foreground"
                >
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl shadow-lg transition",
                      active
                        ? "bg-primary text-primary-foreground shadow-primary/25"
                        : "bg-secondary text-secondary-foreground shadow-black/10"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                  </span>
                  <span className={cn("leading-none", active && "text-primary")}>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[3.45rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-semibold transition",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition",
                    active && "bg-primary/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}
