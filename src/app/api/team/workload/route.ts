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
  const requestedManagerId = searchParams.get("managerId");

  const today = getTodayDateString();

  // If user is a MANAGER, restrict to subordinates/department employees unless SUPER_ADMIN
  let whereClause: any = {
    status: "ACTIVE",
  };

  if (user.role === "SUPER_ADMIN") {
    if (requestedManagerId) whereClause.managerId = requestedManagerId;
  } else {
    // For Team Leader (MANAGER), strictly restrict to employees assigned to that Team Leader
    whereClause.role = "EMPLOYEE";
    whereClause.managerId = user.id;
  }

  const members = await prisma.user.findMany({
    where: whereClause,
    include: {
      department: true,
      tasksAssigned: {
        include: {
          project: { select: { name: true } },
        },
      },
      attendances: {
        where: { date: today },
        include: { breaks: true },
      },
      dailyUpdates: {
        where: { date: today },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  const workloadData = members.map((emp) => {
    const allTasks = emp.tasksAssigned;
    const completed = allTasks.filter((t) => t.status === "COMPLETED");
    const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS");
    const inReview = allTasks.filter((t) => t.status === "REVIEW");
    const blocked = allTasks.filter((t) => t.status === "BLOCKED");
    const todo = allTasks.filter((t) => t.status === "TODO");
    const overdue = allTasks.filter(
      (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now
    );

    // Attendance live state
    const att = emp.attendances[0] || null;
    let liveState = "OFFLINE";
    if (att?.status === "ON_LEAVE") {
      liveState = "ON_LEAVE";
    } else if (att?.checkIn && !att?.checkOut) {
      const onBreak = att.breaks.some((b) => b.endTime === null);
      liveState = onBreak ? "ON_BREAK" : "WORKING";
    }

    const todayUpdate = emp.dailyUpdates[0] || null;

    // Capacity indicator: > 5 active tasks = HIGH, 3-5 = BALANCED, < 3 = AVAILABLE
    const activeTaskCount = inProgress.length + todo.length + inReview.length + blocked.length;
    let capacityStatus: "AVAILABLE" | "BALANCED" | "OVERLOADED" = "BALANCED";
    if (activeTaskCount > 4) capacityStatus = "OVERLOADED";
    else if (activeTaskCount <= 2) capacityStatus = "AVAILABLE";

    return {
      id: emp.id,
      name: emp.name,
      employeeId: emp.employeeId,
      designation: emp.designation || "Team Member",
      department: emp.department?.name || "General",
      avatarUrl: emp.avatarUrl,
      liveState,
      checkInTime: att?.checkIn || null,
      workDurationMinutes: att?.workDurationMinutes || 0,
      capacityStatus,
      tasks: {
        total: allTasks.length,
        active: activeTaskCount,
        completed: completed.length,
        inProgress: inProgress.length,
        inReview: inReview.length,
        blocked: blocked.length,
        todo: todo.length,
        overdue: overdue.length,
        items: allTasks.slice(0, 5),
      },
      todayUpdate,
    };
  });

  return NextResponse.json({
    totalTeamMembers: members.length,
    workload: workloadData,
  });
}
