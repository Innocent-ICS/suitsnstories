import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/auth";

export async function Header() {
    const session = await auth();

    return (
        <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl supporting-backdrop-blur transition-all duration-300">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative h-10 w-auto">
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
                    <span className="text-xl font-serif font-medium tracking-tight text-foreground group-hover:opacity-90 transition-opacity">
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
                <div className="flex items-center gap-4">
                    {/* Sign In / Auth State */}
                    {session ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                                </svg>
                                Dashboard
                            </Link>
                            {session.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    className="w-8 h-8 rounded-full border border-white/10"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                            )}
                            <form
                                action={async () => {
                                    "use server"
                                    await signOut()
                                }}
                            >
                                <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50" title="Log out">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Button asChild className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 shadow-lg shadow-purple-900/20 border-0 h-10 transition-all hover:scale-105 hover:shadow-purple-900/40">
                            <Link href="/learn">
                                Get Started
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
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
