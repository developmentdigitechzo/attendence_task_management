import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = "EMPLOYEE" } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Please enter your full name, email, and password." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Generate unique employee ID sequentially
    const totalUsers = await prisma.user.count();
    let employeeId = `DIG-${String(totalUsers + 1).padStart(3, "0")}`;
    let collision = await prisma.user.findUnique({ where: { employeeId } });
    let counter = totalUsers + 1;
    while (collision) {
      counter++;
      employeeId = `DIG-${String(counter).padStart(3, "0")}`;
      collision = await prisma.user.findUnique({ where: { employeeId } });
    }

    const passwordHash = await hashPassword(password);
    const validRole = ["SUPER_ADMIN", "MANAGER", "EMPLOYEE"].includes(role)
      ? role
      : "EMPLOYEE";

    const newUser = await prisma.user.create({
      data: {
        employeeId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: validRole,
        status: "ACTIVE",
        workLocation: "Office",
        workingHours: "10:00 AM - 07:00 PM",
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const deviceInfo = req.headers.get("user-agent") || "Web Browser";


    // Create session token
    const token = await signSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as any,
      employeeId: newUser.employeeId,
    });

    // Determine redirect
    const redirectUrl =
      newUser.role === "SUPER_ADMIN"
        ? "/admin"
        : newUser.role === "MANAGER"
        ? "/lead"
        : "/employee";

    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: newUser.id,
        employeeId: newUser.employeeId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    await logAuditAction({
      userId: newUser.id,
      userName: newUser.name,
      action: "USER_SIGNUP",
      targetType: "USER",
      targetId: newUser.id,
      details: `New account signed up with role ${newUser.role}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return response;
  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "Account registration failed. Please try again." },
      { status: 500 }
    );
  }
}
