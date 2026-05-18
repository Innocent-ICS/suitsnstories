"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

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
    ADMIN: "Admin",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-muted"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
      >
        {mobileNavOpen ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <Bars3Icon className="h-5 w-5" />
        )}
      </button>

      {/* Page title */}
      <h1 className="text-lg font-medium text-foreground">{pageTitle}</h1>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
          suppressHydrationWarning
        >
          {mounted ? (
            theme === "dark" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )
          ) : (
            <div className="h-5 w-5" />
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
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
