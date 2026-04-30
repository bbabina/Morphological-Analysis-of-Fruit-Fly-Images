import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 🔐 Check for auth (supports NextAuth + custom)
  const nextAuthToken = req.cookies.get("next-auth.session-token");
  const secureNextAuthToken = req.cookies.get("__Secure-next-auth.session-token");
  const customToken = req.cookies.get("auth-token");

  const isLoggedIn = nextAuthToken || secureNextAuthToken || customToken;

  // 🛡 Protected routes
  const protectedRoutes = ["/dashboard", "/batch", "/result"];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 🚫 Block access if not logged in
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ Prevent logged-in users from going back to login
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}