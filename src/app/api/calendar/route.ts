import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const holidays = await prisma.holiday.findMany({
    orderBy: { date: "asc" },
  });

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: { status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true, employeeId: true } },
    },
  });

  const projects = await prisma.project.findMany({
    where: { deadline: { not: null } },
    select: { id: true, name: true, deadline: true, client: true },
  });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    holidays,
    approvedLeaves,
    projects,
    announcements,
  });
}
