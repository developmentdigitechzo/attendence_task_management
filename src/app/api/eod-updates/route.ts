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
  const date = searchParams.get("date") || getTodayDateString();

  const where: any = { date };

  // If regular employee, show own update; if manager, show assigned team updates; if admin, show all
  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  } else if (user.role === "MANAGER") {
    // Team Leader only sees daily standups of employees assigned to them
    where.user = { managerId: user.id };
  }

  const updates = await prisma.dailyUpdate.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          avatarUrl: true,
          designation: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ updates, date });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { completedWork, pendingWork, blockedWork, notes, date } = await req.json();

    if (!completedWork || !pendingWork) {
      return NextResponse.json(
        { error: "Completed work and pending work are required." },
        { status: 400 }
      );
    }

    const targetDate = date || getTodayDateString();

    const update = await prisma.dailyUpdate.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate,
        },
      },
      create: {
        userId: user.id,
        date: targetDate,
        completedWork,
        pendingWork,
        blockedWork: blockedWork || null,
        notes: notes || null,
      },
      update: {
        completedWork,
        pendingWork,
        blockedWork: blockedWork || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "End-of-day update submitted successfully.",
      update,
    });
  } catch (error: any) {
    console.error("EOD update error:", error);
    return NextResponse.json({ error: "Failed to submit end-of-day update." }, { status: 500 });
  }
}
