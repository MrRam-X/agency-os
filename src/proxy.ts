import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 🟢 Next.js 16 Standard: Renamed from "middleware" to "proxy"
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  const isAuth = !!token;
  const isAuthPage =
    path.startsWith("/login") || path.startsWith("/register-org");

  // Auth Page Redirection
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protected Dashboard Router
  if (path.startsWith("/dashboard")) {
    if (!isAuth) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token?.role;

    // Strict RBAC Routing Gates
    const isManagerOrLeadRoute =
      path.startsWith("/dashboard/ledger") ||
      path.startsWith("/dashboard/projects");

    if (isManagerOrLeadRoute) {
      const hasAccess =
        role === "OWNER" || role === "MANAGER" || role === "TEAM_LEAD";
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // Initialize the response
  const response = NextResponse.next();

  // Cache-Control Security Gate
  if (path.startsWith("/dashboard")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

// Matcher configuration remains the same
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register-org"],
};
