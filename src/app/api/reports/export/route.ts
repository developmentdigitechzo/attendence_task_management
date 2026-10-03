import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWeeklyReportData, getMonthlyReportData, getRosterReportData } from "@/lib/reports";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "weekly"; // "weekly" | "monthly" | "roster"
  const format = searchParams.get("format") || "csv"; // "csv" | "excel"
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const month = searchParams.get("month") || "2026-09";
  const departmentId = searchParams.get("departmentId");
  const date = searchParams.get("date") || "2026-09-16";
  const status = searchParams.get("status");

  let rows: any[] = [];
  let filename = `Digitechzo_report_${Date.now()}`;
  let sheetName = "Report";

  if (type === "roster") {
    const data = await getRosterReportData({
      date,
      departmentId,
      statusFilter: status,
    });
    sheetName = `Roster_${data.date}`;
    filename = `Digitechzo_attendance_roster_${data.date}`;

    rows = data.records.map((r) => ({
      "Employee ID": r.employeeId,
      "Employee Name": r.name,
      "Department": r.department,
      "Designation": r.designation,
      "Date": r.date,
      "Check In": r.checkIn,
      "Check Out": r.checkOut,
      "Work Hours": r.workDurationFormatted,
      "Break Hours": r.breakDurationFormatted,
      "Recorded Status": r.status,
      "Live State": r.liveState,
    }));
  } else if (type === "monthly") {
    const data = await getMonthlyReportData({
      month,
      departmentId,
      userRole: user.role,
      userId: user.id,
    });
    sheetName = `Monthly_${data.month}`;
    filename = `Digitechzo_monthly_report_${data.month}`;

    rows = data.report.map((r) => ({
      "Employee ID": r.employeeId,
      "Employee Name": r.name,
      "Department": r.department,
      "Month": data.month,
      "Working Days": r.workingDays,
      "Present": r.present,
      "Late Days": r.late,
      "Leaves": r.leave,
      "Absent": r.absent,
      "Total Work Hours": r.totalHoursFormatted,
      "Avg / Day": r.avgHoursFormatted,
      "Attendance %": `${r.attendancePercentage}%`,
    }));
  } else {
    // Default to weekly
    const data = await getWeeklyReportData({
      startDate,
      endDate,
      departmentId,
      userRole: user.role,
      userId: user.id,
    });
    sheetName = `Weekly_${data.startDate}_${data.endDate}`;
    filename = `Digitechzo_weekly_report_${data.startDate}_to_${data.endDate}`;

    rows = data.report.map((r) => ({
      "Employee ID": r.employeeId,
      "Employee Name": r.name,
      "Department": r.department,
      "Working Days": r.workingDays,
      "Present": r.present,
      "Late Days": r.late,
      "Leaves": r.leave,
      "Absent": r.absent,
      "Total Work Hours": r.totalHoursFormatted,
      "Avg / Day": r.avgHoursFormatted,
    }));
  }

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Notice": "No records found for selected criteria" }]);

  if (format === "excel") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } else {
    // CSV output
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }
}
