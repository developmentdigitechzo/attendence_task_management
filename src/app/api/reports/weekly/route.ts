import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMinutes } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate"); // YYYY-MM-DD
  const endDate = searchParams.get("endDate");     // YYYY-MM-DD
  const departmentId = searchParams.get("departmentId");
  const employeeId = searchParams.get("employeeId");

  // Default to the last 7 days ending today (2026-09-16)
  const end = endDate || "2026-09-16";
  const start = startDate || "2026-09-10";

  // Filter employees
  const userWhere: any = { status: "ACTIVE" };
  if (departmentId && departmentId !== "ALL") userWhere.departmentId = departmentId;
  if (employeeId && employeeId !== "ALL") userWhere.id = employeeId;

  // If regular employee, only show self
  if (user.role === "EMPLOYEE") {
    userWhere.id = user.id;
  }

  const employees = await prisma.user.findMany({
    where: userWhere,
    include: {
      department: true,
      attendances: {
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const reportData = employees.map((emp) => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;
    let absent = 0;
    let totalMinutes = 0;

    emp.attendances.forEach((att) => {
      totalMinutes += att.workDurationMinutes;
      if (att.status === "PRESENT") present++;
      else if (att.status === "LATE") {
        present++;
        late++;
      } else if (att.status === "HALF_DAY") halfDay++;
      else if (att.status === "ON_LEAVE") leave++;
      else if (att.status === "ABSENT") absent++;
    });

    const recordedDays = emp.attendances.length;
    const workingDays = recordedDays || 6;
    const averageMinutesPerDay = present > 0 ? Math.round(totalMinutes / present) : 0;

    return {
      userId: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || "General",
      workingDays,
      present,
      late,
      halfDay,
      leave,
      absent,
      totalMinutes,
      totalHoursFormatted: formatMinutes(totalMinutes),
      avgHoursFormatted: formatMinutes(averageMinutesPerDay),
    };
  });

  return NextResponse.json({
    startDate: start,
    endDate: end,
    report: reportData,
  });
}
