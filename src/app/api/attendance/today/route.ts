import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId") || user.id;

  // Authorization: regular employees can only inspect their own attendance
  if (user.role === "EMPLOYEE" && targetUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = getTodayDateString();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: targetUserId,
        date: today,
      },
    },
    include: {
      breaks: {
        orderBy: { startTime: "asc" },
      },
      corrections: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Check if there is an ongoing break
  const activeBreak = attendance?.breaks.find((b) => b.endTime === null) || null;

  return NextResponse.json({
    date: today,
    attendance,
    activeBreak,
  });
}
