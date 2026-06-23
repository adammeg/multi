import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/register", "/api/auth/register", "/api/auth/login", "/api/auth/forgot-password", "/api/trends"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith("/api/oauth/") || pathname.startsWith("/api/auth/")
  );

  if (isPublic || pathname === "/api/tiktok-verification") return NextResponse.next();

  const token = request.cookies.get("accessToken")?.value;
  const isApiRoute = pathname.startsWith("/api/");
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isApiRoute && !pathname.startsWith("/api/trends") && !token) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
