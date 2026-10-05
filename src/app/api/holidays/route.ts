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

  return NextResponse.json({ holidays });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Superadmin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, date, isOptional } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Holiday name and date are required" }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const existing = await prisma.holiday.findFirst({
      where: {
        date,
        name: trimmedName,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A holiday with this name already exists on this date" }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name: trimmedName,
        date,
        isOptional: Boolean(isOptional),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "HOLIDAY_CREATED",
        targetType: "CALENDAR",
        targetId: holiday.id,
        details: `Created holiday '${holiday.name}' for ${holiday.date}`,
      },
    });

    return NextResponse.json({ success: true, holiday }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating holiday:", error);
    return NextResponse.json({ error: error.message || "Failed to create holiday" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Superadmin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Holiday ID is required" }, { status: 400 });
    }

    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await prisma.holiday.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "HOLIDAY_DELETED",
        targetType: "CALENDAR",
        targetId: id,
        details: `Deleted holiday '${existing.name}' for ${existing.date}`,
      },
    });

    return NextResponse.json({ success: true, message: "Holiday deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json({ error: error.message || "Failed to delete holiday" }, { status: 500 });
  }
}
