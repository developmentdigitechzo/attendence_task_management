import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const where: any = {};
  if (statusFilter) where.status = statusFilter;

  // Regular employees only see their own correction requests
  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  }

  const corrections = await prisma.attendanceCorrection.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          department: { select: { name: true } },
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ corrections });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestedDate, requestedCheckIn, requestedCheckOut, reason } =
      await req.json();

    if (!requestedDate || !reason) {
      return NextResponse.json(
        { error: "Date and reason are required." },
        { status: 400 }
      );
    }

    // Find existing attendance for this date if any
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: requestedDate,
        },
      },
    });

    const correction = await prisma.attendanceCorrection.create({
      data: {
        userId: user.id,
        attendanceId: existingAttendance?.id || null,
        requestedDate,
        requestedCheckIn: requestedCheckIn || null,
        requestedCheckOut: requestedCheckOut || null,
        reason,
        status: "PENDING",
      },
    });

    // Notify Admins and Managers
    const adminsAndManagers = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "MANAGER"] },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    for (const admin of adminsAndManagers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Attendance Correction Submitted",
          message: `${user.name} requested an attendance correction for ${requestedDate}.`,
          type: "CORRECTION_STATUS",
          linkUrl: "/admin/attendance",
        },
      });
    }

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "CORRECTION_REQUESTED",
      targetType: "ATTENDANCE_CORRECTION",
      targetId: correction.id,
      details: `Correction requested for date ${requestedDate}: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: "Attendance correction request submitted for manager review.",
      correction,
    });
  } catch (error: any) {
    console.error("Attendance correction submit error:", error);
    return NextResponse.json(
      { error: "Unable to submit correction request." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Only admins and managers can review attendance corrections." },
        { status: 403 }
      );
    }

    const { correctionId, action, reviewNotes } = await req.json(); // action: "APPROVE" | "REJECT"

    if (!correctionId || !action) {
      return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
    }

    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
      include: { user: true },
    });

    if (!correction) {
      return NextResponse.json({ error: "Correction request not found." }, { status: 404 });
    }

    if (action === "APPROVE") {
      // Calculate times
      let checkInDate: Date | undefined;
      let checkOutDate: Date | undefined;
      let durationMinutes = 480; // default 8 hours if both provided

      if (correction.requestedCheckIn) {
        checkInDate = new Date(`${correction.requestedDate}T${correction.requestedCheckIn}:00Z`);
      }
      if (correction.requestedCheckOut) {
        checkOutDate = new Date(`${correction.requestedDate}T${correction.requestedCheckOut}:00Z`);
      }
      if (checkInDate && checkOutDate) {
        durationMinutes = Math.max(
          0,
          Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60))
        );
      }

      // Upsert attendance record
      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: correction.userId,
            date: correction.requestedDate,
          },
        },
        create: {
          userId: correction.userId,
          date: correction.requestedDate,
          checkIn: checkInDate || new Date(`${correction.requestedDate}T09:00:00Z`),
          checkOut: checkOutDate || new Date(`${correction.requestedDate}T18:00:00Z`),
          status: "PRESENT",
          workDurationMinutes: durationMinutes,
          notes: `Corrected by ${user.name}: ${correction.reason}`,
        },
        update: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: "PRESENT",
          workDurationMinutes: durationMinutes,
          notes: `Corrected by ${user.name}: ${correction.reason}`,
        },
      });

      await prisma.attendanceCorrection.update({
        where: { id: correctionId },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
          reviewNotes: reviewNotes || "Approved by manager",
        },
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: correction.userId,
          title: "Attendance Correction Approved",
          message: `Your attendance correction for ${correction.requestedDate} has been approved.`,
          type: "CORRECTION_STATUS",
          linkUrl: "/employee/attendance",
        },
      });

      await logAuditAction({
        userId: user.id,
        userName: user.name,
        action: "CORRECTION_APPROVED",
        targetType: "ATTENDANCE_CORRECTION",
        targetId: correction.id,
        details: `Approved attendance correction for ${correction.user.name} on ${correction.requestedDate}`,
      });

      return NextResponse.json({
        success: true,
        message: "Attendance correction approved and record updated.",
      });
    } else {
      await prisma.attendanceCorrection.update({
        where: { id: correctionId },
        data: {
          status: "REJECTED",
          reviewedById: user.id,
          reviewNotes: reviewNotes || "Rejected by manager",
        },
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: correction.userId,
          title: "Attendance Correction Rejected",
          message: `Your attendance correction for ${correction.requestedDate} was rejected: ${reviewNotes || "No reason specified."}`,
          type: "CORRECTION_STATUS",
          linkUrl: "/employee/attendance",
        },
      });

      await logAuditAction({
        userId: user.id,
        userName: user.name,
        action: "CORRECTION_REJECTED",
        targetType: "ATTENDANCE_CORRECTION",
        targetId: correction.id,
        details: `Rejected attendance correction for ${correction.user.name} on ${correction.requestedDate}`,
      });

      return NextResponse.json({
        success: true,
        message: "Attendance correction rejected.",
      });
    }
  } catch (error: any) {
    console.error("Attendance correction review error:", error);
    return NextResponse.json(
      { error: "Unable to review correction request." },
      { status: 500 }
    );
  }
}
