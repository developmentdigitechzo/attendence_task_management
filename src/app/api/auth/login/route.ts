import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signSessionToken } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { ensureUserCheckedInToday } from "@/lib/attendance";

export async function POST(req: NextRequest) {
  try {
    const { email, password, portal } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter both email and password." },
        { status: 400 }
      );
    }

    let normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === "manager@digitechzo.com") normalizedEmail = "lead@digitechzo.com";
    if (normalizedEmail === "john@digitechzo.com") normalizedEmail = "employee@digitechzo.com";

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This employee account is deactivated. Contact administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    if (portal === "admin" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. This account does not have Administrator privileges. Please use the Team Lead (/lead/login) or Employee (/employee/login) portal." },
        { status: 403 }
      );
    }

    if (portal === "lead" && user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Access denied. This account does not have Team Lead / Manager privileges. Please use the Employee portal (/employee/login)." },
        { status: 403 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const deviceInfo = req.headers.get("user-agent") || "Web Browser";

    // Update last active time & auto check-in so user state is WORKING upon login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    await ensureUserCheckedInToday(user.id, ipAddress, deviceInfo);

    // Create session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      employeeId: user.employeeId,
    });

    // Determine default redirect for the 3 distinct portals
    const redirectUrl =
      user.role === "SUPER_ADMIN"
        ? "/admin"
        : user.role === "MANAGER"
        ? "/lead"
        : "/employee";

    // Set cookie
    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department?.name,
        designation: user.designation,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Audit log
    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "USER_LOGIN",
      targetType: "USER",
      targetId: user.id,
      details: `User logged in from ${req.headers.get("user-agent") || "web"}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
