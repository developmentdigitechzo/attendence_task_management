import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation password do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password." },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "PASSWORD_CHANGED",
        targetType: "USER",
        targetId: user.id,
        details: `Password changed for user ${user.name} (${user.employeeId})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to change password." },
      { status: 500 }
    );
  }
}
