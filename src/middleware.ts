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

  // Helper to create redirect to role-specific login portal
  const redirectToLogin = (fromPath?: string) => {
    let target = "/login";
    if (fromPath?.startsWith("/admin")) target = "/admin/login";
    else if (fromPath?.startsWith("/lead")) target = "/lead/login";
    else if (fromPath?.startsWith("/employee")) target = "/employee/login";

    const loginUrl = new URL(target, req.url);
    if (fromPath && fromPath !== "/" && !fromPath.endsWith("/login")) {
      loginUrl.searchParams.set("from", fromPath);
    }
    const res = NextResponse.redirect(loginUrl);
    if (token && !session) {
      res.cookies.delete("auth_token");
    }
    return res;
  };

  // 1. Dedicated & General Login Pages Handling
  const isLoginPage =
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/lead/login" ||
    pathname === "/employee/login";

  if (isLoginPage) {
    const res = NextResponse.next();
    if (token && !session) {
      res.cookies.delete("auth_token");
    }
    return res;
  }

  // 2. Root /
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
      return NextResponse.redirect(new URL(getPortalForRole(session.role), req.url));
    }
    return NextResponse.next();
  }

  // 4. Team Lead portal protection (/lead and /lead/*)
  if (pathname.startsWith("/lead")) {
    if (!session) {
      return redirectToLogin(pathname);
    }
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
    // Projects and milestones are removed for employee role
    if (pathname.startsWith("/employee/projects")) {
      return NextResponse.redirect(new URL("/employee", req.url));
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
