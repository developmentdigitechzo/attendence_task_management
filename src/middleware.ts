import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "digitechzo-secure-session-auth-token-key-2026";
const secret = new TextEncoder().encode(JWT_SECRET_STRING);

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "MANAGER" | "EMPLOYEE";
  employeeId: string;
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function getPortalForRole(role: string): string {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "MANAGER") return "/lead";
  return "/employee";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;

  // 1. If accessing /login, allow access so user can sign in or switch accounts
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Helper to create redirect to login and clear any invalid token
  const redirectToLogin = (fromPath?: string) => {
    const loginUrl = new URL("/login", req.url);
    if (fromPath && fromPath !== "/") {
      loginUrl.searchParams.set("from", fromPath);
    }
    const res = NextResponse.redirect(loginUrl);
    if (token && !session) {
      res.cookies.delete("auth_token");
    }
    return res;
  };

  // 2. If accessing root /
  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(new URL(getPortalForRole(session.role), req.url));
    }
    return redirectToLogin();
  }

  // 3. Admin portal protection (/admin and /admin/*)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return redirectToLogin(pathname);
    }
    if (session.role !== "SUPER_ADMIN") {
      // Unauthorized role: redirect to their appropriate role portal
      return NextResponse.redirect(new URL(getPortalForRole(session.role), req.url));
    }
    return NextResponse.next();
  }

  // 4. Team Lead portal protection (/lead and /lead/*)
  if (pathname.startsWith("/lead")) {
    if (!session) {
      return redirectToLogin(pathname);
    }
    // Only SUPER_ADMIN and MANAGER are allowed
    if (session.role === "EMPLOYEE") {
      return NextResponse.redirect(new URL("/employee", req.url));
    }
    return NextResponse.next();
  }

  // 5. Employee portal protection (/employee and /employee/*)
  if (pathname.startsWith("/employee")) {
    if (!session) {
      return redirectToLogin(pathname);
    }
    return NextResponse.next();
  }

  // 6. Shared authenticated portals (/chat, /announcements)
  if (pathname.startsWith("/chat") || pathname.startsWith("/announcements")) {
    if (!session) {
      return redirectToLogin(pathname);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/lead/:path*",
    "/employee/:path*",
    "/chat/:path*",
    "/announcements/:path*",
  ],
};
