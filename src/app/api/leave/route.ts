import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { logAuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status && status !== "ALL") where.status = status;

  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  }

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          avatarUrl: true,
          department: { select: { name: true } },
          designation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, startDate, endDate, totalDays = 1, reason } = await req.json();

    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Start date, end date, and reason are required." },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        type: type || "CASUAL",
        startDate,
        endDate,
        totalDays: parseInt(totalDays, 10) || 1,
        reason,
        status: "PENDING",
      },
    });

    // Notify Managers and Admins
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "MANAGER"] },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    for (const app of approvers) {
      await createNotification({
        data: {
          userId: app.id,
          title: "New Leave Application",
          message: `${user.name} applied for ${type || "Casual"} Leave (${startDate} to ${endDate})`,
          type: "LEAVE_STATUS",
          linkUrl: "/admin/leave",
        },
      });
    }

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "LEAVE_APPLIED",
      targetType: "LEAVE",
      targetId: leave.id,
      details: `${type} leave applied from ${startDate} to ${endDate}: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: "Leave application submitted successfully.",
      leave,
    });
  } catch (error: any) {
    console.error("Leave application error:", error);
    return NextResponse.json({ error: "Failed to apply for leave." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { leaveId, action, reviewNotes } = await req.json(); // action: "APPROVE" | "REJECT"
    if (!leaveId || !action) {
      return NextResponse.json({ error: "leaveId and action are required." }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        reviewedById: user.id,
        reviewNotes: reviewNotes || null,
      },
    });

    // If approved, create or update attendance record for those dates as ON_LEAVE
    if (action === "APPROVE") {
      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: leave.userId,
            date: leave.startDate,
          },
        },
        create: {
          userId: leave.userId,
          date: leave.startDate,
          status: "ON_LEAVE",
          workDurationMinutes: 0,
          breakDurationMinutes: 0,
          notes: `${leave.type} Leave approved: ${leave.reason}`,
        },
        update: {
          status: "ON_LEAVE",
          notes: `${leave.type} Leave approved: ${leave.reason}`,
        },
      });
    }

    // Send notification to employee
    await createNotification({
      data: {
        userId: leave.userId,
        title: `Leave Request ${status}`,
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()}.${reviewNotes ? ` Note: ${reviewNotes}` : ""}`,
        type: "LEAVE_STATUS",
        linkUrl: "/employee/leave",
      },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: `LEAVE_${status}`,
      targetType: "LEAVE",
      targetId: leave.id,
      details: `${status} leave for ${leave.user.name} (${leave.startDate} to ${leave.endDate})`,
    });

    return NextResponse.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leave: updated,
    });
  } catch (error: any) {
    console.error("Leave review error:", error);
    return NextResponse.json({ error: "Failed to process leave." }, { status: 500 });
  }
}
