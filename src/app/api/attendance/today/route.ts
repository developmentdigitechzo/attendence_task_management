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

  let attendance = await prisma.attendance.findUnique({
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

  // For Admin role: ensure attendance is active/Working after login
  if (user.role === "SUPER_ADMIN" && targetUserId === user.id) {
    if (!attendance) {
      try {
        attendance = await prisma.attendance.create({
          data: {
            userId: user.id,
            date: today,
            checkIn: new Date(),
            status: "PRESENT",
            notes: "[Office]",
          },
          include: {
            breaks: { orderBy: { startTime: "asc" } },
            corrections: { orderBy: { createdAt: "desc" } },
          },
        });
      } catch {}
    } else if (!attendance.checkIn && !attendance.checkOut) {
      try {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkIn: new Date(),
            status: "PRESENT",
            notes: attendance.notes || "[Office]",
          },
          include: {
            breaks: { orderBy: { startTime: "asc" } },
            corrections: { orderBy: { createdAt: "desc" } },
          },
        });
      } catch {}
    }
  }

  // Check if there is an ongoing break
  const activeBreak = attendance?.breaks?.find((b) => b.endTime === null) || null;

  let workType: "Work from Home" | "Office" | null = null;
  if (attendance?.checkIn) {
    if (attendance.notes?.includes("Work from Home")) {
      workType = "Work from Home";
    } else {
      workType = "Office";
    }
  }

  return NextResponse.json({
    date: today,
    attendance,
    activeBreak,
    workType,
  });
}
