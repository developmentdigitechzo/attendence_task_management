import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { logAuditAction } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcements = await prisma.announcement.findMany({
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, priority = "NORMAL", audience = "EVERYONE", departmentId } =
      await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        audience,
        departmentId: departmentId || null,
        createdById: user.id,
      },
    });

    // Notify employees
    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        status: "ACTIVE",
        ...(departmentId ? { departmentId } : {}),
      },
      select: { id: true },
    });

    for (const u of allUsers) {
      await createNotification({
        data: {
          userId: u.id,
          title: `Announcement: ${title}`,
          message: content.length > 80 ? content.slice(0, 80) + "..." : content,
          type: "ANNOUNCEMENT",
          linkUrl: "/announcements",
        },
      });
    }

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "ANNOUNCEMENT_CREATED",
      targetType: "ANNOUNCEMENT",
      targetId: announcement.id,
      details: `Created announcement: "${title}" (${priority})`,
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error("Announcement error:", error);
    return NextResponse.json({ error: "Failed to create announcement." }, { status: 500 });
  }
}
