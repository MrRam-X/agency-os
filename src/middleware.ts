import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // 1. Retrieve the JWT session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  const isAuth = !!token;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register-org");

  // 2. Auth Page Redirection (Prevent logged-in users from seeing /login or /register-org)
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 3. Protected Dashboard Router
  if (path.startsWith("/dashboard")) {
    if (!isAuth) {
      // Force redirect to login if no token is found
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token?.role;

    // 4. Strict RBAC Routing Gates (Projects and Ledger are Manager/Lead only)
    const isManagerOrLeadRoute = 
      path.startsWith("/dashboard/ledger") || 
      path.startsWith("/dashboard/projects");

    if (isManagerOrLeadRoute) {
      const hasAccess = role === "OWNER" || role === "MANAGER" || role === "TEAM_LEAD";
      if (!hasAccess) {
        // Silently redirect unauthorized Developers/Testers back to their main dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

// 5. Matcher configuration: Tells Next.js exactly which paths to run the middleware on
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register-org"],
};