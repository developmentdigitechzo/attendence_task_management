import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";
import { calculateWorkingMinutes } from "@/lib/attendance";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTodayDateString();
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      include: {
        breaks: true,
      },
    });

    if (!attendance || !attendance.checkIn) {
      return NextResponse.json(
        { error: "You have not checked in today yet." },
        { status: 400 }
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: "You have already checked out for today." },
        { status: 400 }
      );
    }

    const now = new Date();

    // If an ongoing break exists, close it first
    const ongoingBreak = attendance.breaks.find((b) => b.endTime === null);
    if (ongoingBreak) {
      const elapsedMs = now.getTime() - ongoingBreak.startTime.getTime();
      const breakDuration = Math.max(1, Math.round(elapsedMs / (1000 * 60)));
      await prisma.break.update({
        where: { id: ongoingBreak.id },
        data: {
          endTime: now,
          durationMinutes: breakDuration,
        },
      });
    }

    // Recalculate total break duration from all breaks in DB
    const allBreaks = await prisma.break.findMany({
      where: { attendanceId: attendance.id },
    });
    const totalBreakMinutes = allBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    // Calculate total net working minutes
    const workMinutes = calculateWorkingMinutes(
      attendance.checkIn,
      now,
      totalBreakMinutes
    );

    // If total hours < 4 and wasn't late or absent, it could be considered half-day
    let finalStatus = attendance.status;
    if (workMinutes < 240 && finalStatus === "PRESENT") {
      finalStatus = "HALF_DAY";
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workDurationMinutes: workMinutes,
        breakDurationMinutes: totalBreakMinutes,
        status: finalStatus,
      },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "ATTENDANCE_CHECK_OUT",
      targetType: "ATTENDANCE",
      targetId: updated.id,
      details: `Checked out at ${now.toLocaleTimeString()} with total duration ${workMinutes} mins`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: "Checked out successfully.",
      attendance: updated,
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Unable to check out. Please try again." }, { status: 500 });
  }
}
