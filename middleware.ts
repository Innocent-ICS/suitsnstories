import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware for route protection and access control.
 * 
 * Route groups:
 * - (marketing)/* → Public, no auth required
 * - (auth)/*      → Auth pages, redirect away if already logged in
 * - (platform)/*  → Requires authentication (enforced by layout, middleware provides early redirect)
 * - (admin)/*     → Requires authentication + ADMIN role (enforced by layout)
 * - api/*         → Handled separately per route
 * 
 * Note: This middleware is optimized for Edge runtime to stay under 1MB size limit.
 * Session validation happens in layouts/pages using auth() from @/auth.
 */
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // Check for session token (NextAuth v5 uses authjs.session-token)
    // HTTP: authjs.session-token
    // HTTPS: __Host-authjs.session-token or __Secure-authjs.session-token
    const sessionToken = req.cookies.get("authjs.session-token") || 
                        req.cookies.get("__Host-authjs.session-token") ||
                        req.cookies.get("__Secure-authjs.session-token");
    const isLoggedIn = !!sessionToken;

    // Auth routes: redirect logged-in users away from signin/signup
    const isAuthRoute = pathname.startsWith("/auth");
    const isAuthUtilityRoute =
        pathname.startsWith("/auth/verify-email") ||
        pathname.startsWith("/auth/resend-verification");
    if (isAuthRoute && isLoggedIn && !isAuthUtilityRoute) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // Protected platform routes: redirect unauthenticated users to signin
    const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/learn") ||
        pathname.startsWith("/diagnostic") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/coaching") ||
        pathname.startsWith("/workshops") ||
        pathname.startsWith("/bookings") ||
        pathname.startsWith("/recommendations") ||
        pathname.startsWith("/billing") ||
        pathname.startsWith("/settings");

    if (isProtectedRoute && !isLoggedIn) {
        const signinUrl = new URL("/auth/signin", req.nextUrl);
        signinUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signinUrl);
    }

    // Admin routes: redirect unauthenticated users (role check happens in layout)
    const isAdminRoute =
        pathname.startsWith("/content") ||
        pathname.startsWith("/clients") ||
        pathname.startsWith("/engineers") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/perceptoscope-security") ||
        pathname.startsWith("/recommendations-admin") ||
        pathname.startsWith("/inquiries");

    if (isAdminRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
    }

    // All other routes (marketing) are public — no action needed
    return NextResponse.next();
}

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
