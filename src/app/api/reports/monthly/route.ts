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
  const month = searchParams.get("month") || "2026-09"; // YYYY-MM
  const departmentId = searchParams.get("departmentId");
  const employeeId = searchParams.get("employeeId");

  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const userWhere: any = { status: "ACTIVE" };
  if (departmentId && departmentId !== "ALL") userWhere.departmentId = departmentId;
  if (employeeId && employeeId !== "ALL") userWhere.id = employeeId;

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
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const report = employees.map((emp) => {
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

    // Assume 24 standard working days in a month if no records or calculate from records
    const workingDays = Math.max(emp.attendances.length, 14);
    const attendancePercentage = workingDays > 0 ? Math.round(((present + halfDay * 0.5) / workingDays) * 100) : 0;
    const avgDailyMinutes = present > 0 ? Math.round(totalMinutes / present) : 0;

    return {
      userId: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || "General",
      workingDays,
      present,
      absent,
      leave,
      late,
      halfDay,
      totalHoursFormatted: formatMinutes(totalMinutes),
      avgHoursFormatted: formatMinutes(avgDailyMinutes),
      attendancePercentage: Math.min(100, attendancePercentage),
    };
  });

  return NextResponse.json({
    month,
    report,
  });
}
