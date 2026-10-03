import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMinutes } from "@/lib/utils";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "weekly"; // "weekly" | "monthly"
  const format = searchParams.get("format") || "csv"; // "csv" | "excel"
  const month = searchParams.get("month") || "2026-09";

  const employees = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    include: {
      department: true,
      attendances: true,
    },
    orderBy: { name: "asc" },
  });

  const rows = employees.map((emp) => {
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

    const workingDays = Math.max(emp.attendances.length, 6);
    const avgDailyMinutes = present > 0 ? Math.round(totalMinutes / present) : 0;
    const attPct = workingDays > 0 ? Math.round(((present + halfDay * 0.5) / workingDays) * 100) : 0;

    if (type === "weekly") {
      return {
        "Employee ID": emp.employeeId,
        "Full Name": emp.name,
        Department: emp.department?.name || "General",
        "Working Days": workingDays,
        "Present Days": present,
        "Late Days": late,
        "Half Days": halfDay,
        "Leave Days": leave,
        "Absent Days": absent,
        "Total Hours": formatMinutes(totalMinutes),
        "Avg Hours/Day": formatMinutes(avgDailyMinutes),
      };
    } else {
      return {
        "Employee ID": emp.employeeId,
        "Full Name": emp.name,
        Department: emp.department?.name || "General",
        Month: month,
        "Working Days": workingDays,
        Present: present,
        Absent: absent,
        Leave: leave,
        Late: late,
        "Half Day": halfDay,
        "Total Hours": formatMinutes(totalMinutes),
        "Avg Hours": formatMinutes(avgDailyMinutes),
        "Attendance %": `${Math.min(100, attPct)}%`,
      };
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  if (format === "excel") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}_report`);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Digitechzo_${type}_report_${Date.now()}.xlsx"`,
      },
    });
  } else {
    // CSV output
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Digitechzo_${type}_report_${Date.now()}.csv"`,
      },
    });
  }
}
