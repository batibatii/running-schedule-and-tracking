import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthPage = req.nextUrl.pathname === "/";
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isStravaWebhook = req.nextUrl.pathname.startsWith(
    "/api/strava/webhook",
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Auth] ${req.method} ${req.nextUrl.pathname} - User: ${token?.email || "anonymous"}`,
    );
  }

  if (isAuthPage && token) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Auth] Redirecting logged-in user from / to /schedule`);
    }
    return NextResponse.redirect(new URL("/schedule", req.url));
  }

  if (isAuthPage || isApiAuthRoute || isStravaWebhook) {
    return NextResponse.next();
  }

  if (!token) {
    const url = new URL("/", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/",
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
