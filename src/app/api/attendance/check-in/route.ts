import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";
import { determineCheckInStatus } from "@/lib/attendance";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTodayDateString();
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      return NextResponse.json(
        { error: "You have already checked in for today." },
        { status: 400 }
      );
    }

    const now = new Date();
    const status = await determineCheckInStatus(now);

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const deviceInfo = req.headers.get("user-agent") || "Web Browser";

    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkIn: now,
            status,
            ipAddress,
            deviceInfo,
          },
        })
      : await prisma.attendance.create({
          data: {
            userId: user.id,
            date: today,
            checkIn: now,
            status,
            ipAddress,
            deviceInfo,
          },
        });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "ATTENDANCE_CHECK_IN",
      targetType: "ATTENDANCE",
      targetId: attendance.id,
      details: `Checked in at ${now.toLocaleTimeString()} with status ${status}`,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Checked in successfully as ${status}`,
      attendance,
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Unable to check in. Please try again." }, { status: 500 });
  }
}
