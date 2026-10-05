import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, reason } = await req.json(); // action: "start" | "end"
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
        { error: "You must check in first before taking a break." },
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
    const activeBreak = attendance.breaks.find((b) => b.endTime === null);

    if (action === "start") {
      if (activeBreak) {
        return NextResponse.json(
          { error: "You already have an ongoing break." },
          { status: 400 }
        );
      }

      const newBreak = await prisma.break.create({
        data: {
          attendanceId: attendance.id,
          userId: user.id,
          startTime: now,
          reason: reason || "Standard break",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Break started.",
        break: newBreak,
      });
    } else if (action === "end") {
      if (!activeBreak) {
        return NextResponse.json(
          { error: "You do not have an active break to end." },
          { status: 400 }
        );
      }

      const elapsedMs = now.getTime() - activeBreak.startTime.getTime();
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const duration = Math.max(1, Math.round(elapsedSec / 60));

      const endedBreak = await prisma.break.update({
        where: { id: activeBreak.id },
        data: {
          endTime: now,
          durationMinutes: duration,
        },
      });

      // Sum all completed breaks to ensure 100% calculation accuracy
      const allBreaks = await prisma.break.findMany({
        where: { attendanceId: attendance.id },
      });
      const totalBreakMinutes = allBreaks.reduce(
        (acc, b) => acc + (b.id === endedBreak.id ? duration : (b.durationMinutes || 0)),
        0
      );

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          breakDurationMinutes: totalBreakMinutes,
        },
        include: { breaks: true },
      });

      return NextResponse.json({
        success: true,
        message: `Break ended (${duration} min). All breaks recalculated.`,
        break: endedBreak,
        attendance: updatedAttendance,
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'start' or 'end'." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Break action error:", error);
    return NextResponse.json({ error: "Unable to process break. Please try again." }, { status: 500 });
  }
}
