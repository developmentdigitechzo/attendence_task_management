import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetDate = searchParams.get("date") || getTodayDateString();
  const departmentId = searchParams.get("departmentId");
  const statusFilter = searchParams.get("status");

  // 1. Get active employees
  const userWhere: any = { status: "ACTIVE" };
  if (user.role === "MANAGER") {
    userWhere.managerId = user.id;
  } else if (departmentId && departmentId !== "ALL") {
    userWhere.departmentId = departmentId;
  }

  const employees = await prisma.user.findMany({
    where: userWhere,
    include: {
      department: true,
      attendances: {
        where: { date: targetDate },
        include: { breaks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let onLeaveCount = 0;
  let currentlyWorkingCount = 0;
  let notCheckedInCount = 0;

  const records = employees.map((emp) => {
    const att = emp.attendances[0] || null;
    let liveState = "OFFLINE"; // WORKING, ON_BREAK, OFFLINE, ABSENT, ON_LEAVE

    if (!att || (!att.checkIn && att.status !== "ON_LEAVE")) {
      notCheckedInCount++;
      liveState = "OFFLINE";
    } else if (att.status === "ON_LEAVE") {
      onLeaveCount++;
      liveState = "ON_LEAVE";
    } else if (att.checkIn && !att.checkOut) {
      // Check if on active break
      const hasActiveBreak = att.breaks.some((b) => b.endTime === null);
      if (hasActiveBreak) {
        liveState = "ON_BREAK";
      } else {
        liveState = "WORKING";
      }
      currentlyWorkingCount++;
      presentCount++;
      if (att.status === "LATE") lateCount++;
    } else if (att.checkOut) {
      liveState = "OFFLINE";
      presentCount++;
      if (att.status === "LATE") lateCount++;
    }

    return {
      userId: emp.id,
      name: emp.name,
      employeeId: emp.employeeId,
      department: emp.department?.name || "General",
      designation: emp.designation,
      avatarUrl: emp.avatarUrl,
      checkIn: att?.checkIn || null,
      checkOut: att?.checkOut || null,
      status: att?.status || "NOT_CHECKED_IN",
      workDurationMinutes: att?.workDurationMinutes || 0,
      breakDurationMinutes: att?.breakDurationMinutes || 0,
      liveState,
    };
  });

  let filteredRecords = records;
  if (statusFilter && statusFilter !== "ALL") {
    filteredRecords = records.filter((r) => r.status === statusFilter || r.liveState === statusFilter);
  }

  return NextResponse.json({
    date: targetDate,
    stats: {
      totalEmployees: employees.length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      onLeave: onLeaveCount,
      currentlyWorking: currentlyWorkingCount,
      notCheckedIn: notCheckedInCount,
    },
    records: filteredRecords,
  });
}
