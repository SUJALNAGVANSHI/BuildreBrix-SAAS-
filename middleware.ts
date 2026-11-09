import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("bb_auth_session")?.value;

  // Global Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';"
  );

  // Protected Admin Routes
  if (pathname.startsWith("/dashboard/admin") || pathname === "/api/audit") {
    if (!sessionCookie) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized: Privileged administrative session required." },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_required", "admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected Analyst Routes
  if (pathname.startsWith("/dashboard/analyst")) {
    if (!sessionCookie) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized: Analyst session required." },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_required", "analyst");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
