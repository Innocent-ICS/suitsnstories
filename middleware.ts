import { auth } from "@/auth";

/**
 * Middleware for route protection and access control.
 * 
 * Route groups:
 * - (marketing)/* → Public, no auth required
 * - (auth)/*      → Auth pages, redirect away if already logged in
 * - (platform)/*  → Requires authentication (enforced by layout, middleware provides early redirect)
 * - (admin)/*     → Requires authentication + ADMIN role (enforced by layout)
 * - api/*         → Handled separately per route
 */
export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Auth routes: redirect logged-in users away from signin/signup
    const isAuthRoute = pathname.startsWith("/auth");
    if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", req.nextUrl));
    }

    // Protected platform routes: redirect unauthenticated users to signin
    const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/learn") ||
        pathname.startsWith("/diagnose") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/coaching") ||
        pathname.startsWith("/workshops") ||
        pathname.startsWith("/bookings") ||
        pathname.startsWith("/billing") ||
        pathname.startsWith("/settings");

    if (isProtectedRoute && !isLoggedIn) {
        const signinUrl = new URL("/auth/signin", req.nextUrl);
        signinUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(signinUrl);
    }

    // Admin routes: redirect unauthenticated users (role check happens in layout)
    const isAdminRoute =
        pathname.startsWith("/content") ||
        pathname.startsWith("/clients") ||
        pathname.startsWith("/engineers") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/narratometer-security") ||
        pathname.startsWith("/inquiries");

    if (isAdminRoute && !isLoggedIn) {
        return Response.redirect(new URL("/auth/signin", req.nextUrl));
    }

    // All other routes (marketing) are public — no action needed
});

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
