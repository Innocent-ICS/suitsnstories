import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MenuIcon, XMarkIcon } from "@/components/icons/app-icons";

export function Header() {
    return (
        <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl supporting-backdrop-blur transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3 group">
                    <div className="relative h-9 w-auto shrink-0 sm:h-10">
                        <Image
                            src="/images/logo-light.png"
                            alt="Suits & Stories Logo"
                            width={180}
                            height={50}
                            className="h-full w-auto object-contain dark:hidden"
                            priority
                        />
                        <Image
                            src="/images/logo-dark.png"
                            alt="Suits & Stories Logo"
                            width={180}
                            height={50}
                            className="h-full w-auto object-contain hidden dark:block"
                            priority
                        />
                    </div>
                    <span className="truncate text-base font-serif font-medium tracking-tight text-foreground group-hover:opacity-90 transition-opacity sm:text-xl">
                        Suits <span className="italic text-muted-foreground">&</span> Stories
                    </span>
                </Link>

                {/* Navigation - Centered & Premium */}
                <nav className="hidden md:flex items-center gap-8">
                    <NavLink href="/methodology">Methodology</NavLink>
                    <NavLink href="/services">Services</NavLink>
                    <NavLink href="/about">About</NavLink>
                    <NavLink href="/contact">Contact</NavLink>
                </nav>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <Link
                        href="/dashboard"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                    >
                        Dashboard
                    </Link>
                    <Button asChild className="h-10 rounded-full border-0 bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 sm:px-6">
                        <Link href="/learn">
                            Get Started
                        </Link>
                    </Button>
                    <details className="group relative md:hidden">
                        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
                            <span className="sr-only">Navigation</span>
                            <MenuIcon className="h-5 w-5 group-open:hidden" />
                            <XMarkIcon className="hidden h-5 w-5 group-open:block" />
                        </summary>
                        <div className="absolute right-0 top-12 w-56 rounded-lg border border-border bg-card p-2 shadow-xl">
                            <MobileNavLink href="/methodology">Methodology</MobileNavLink>
                            <MobileNavLink href="/services">Services</MobileNavLink>
                            <MobileNavLink href="/about">About</MobileNavLink>
                            <MobileNavLink href="/contact">Contact</MobileNavLink>
                        </div>
                    </details>
                </div>
            </div>
        </header>
    );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
            {children}
        </Link>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all group-hover:w-full" />
        </Link>
    )
}
