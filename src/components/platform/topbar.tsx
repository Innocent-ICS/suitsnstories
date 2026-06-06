"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { UserRole } from "@/types/auth";

interface TopbarProps {
  userName?: string | null;
  userEmail?: string | null;
  userRole: UserRole;
  userImage?: string | null;
}

export function Topbar({ userName, userEmail, userRole, userImage }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const isDark = resolvedTheme === "dark";

  // Get page title from pathname
  const pageTitle = pathname
    .split("/")
    .filter(Boolean)[0]
    ?.replace(/-/g, " ")
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard";

  const roleBadge: Record<UserRole, string> = {
    CLIENT: "Client",
    COACH: "Coach",
    PERCEPTION_ENGINEER: "Engineer",
    PROGRAM_MANAGER: "Program Manager",
    ADMIN: "Admin",
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-card/85 px-3 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-4 md:px-6">
      {/* Page title */}
      <h1 className="min-w-0 flex-1 truncate px-1 text-[1.05rem] font-semibold leading-none text-foreground sm:text-lg md:px-0">
        {pageTitle}
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <Link
          href="/recommendations"
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Recommendations"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </Link>

        <Link
          href="/settings"
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Settings"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          <SunIcon className="hidden h-5 w-5 dark:block" />
          <MoonIcon className="h-5 w-5 dark:hidden" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted"
          >
            <UserAvatar src={userImage} name={userName} />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">
                {userName || "User"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {roleBadge[userRole]}
              </p>
            </div>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>

                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserCircleIcon className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Settings
                </Link>

                <div className="border-t border-border mt-1.5 pt-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
