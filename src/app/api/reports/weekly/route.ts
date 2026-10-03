import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWeeklyReportData } from "@/lib/reports";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const departmentId = searchParams.get("departmentId");
  const employeeId = searchParams.get("employeeId");

  const data = await getWeeklyReportData({
    startDate,
    endDate,
    departmentId,
    employeeId,
    userRole: user.role,
    userId: user.id,
  });

  return NextResponse.json(data);
}
