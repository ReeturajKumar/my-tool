import { clerkMiddleware } from "@clerk/nextjs/server";

// clerkMiddleware() without createRouteMatcher — auth checks are done
// inside each route/page using auth().protect() or currentUser().
// The webhook route (/api/webhooks) is intentionally public and handles
// its own verification via the Svix signature.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
