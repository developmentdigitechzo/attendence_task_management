import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { logAuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deptFilter = searchParams.get("departmentId");

  const whereClause: any = {};

  if (user.role === "SUPER_ADMIN") {
    if (deptFilter) {
      whereClause.departmentId = deptFilter;
    }
  } else {
    // Non-super-admin users only see company-wide announcements, their own department's announcements, or ones they created
    const orConditions: any[] = [
      { audience: "EVERYONE" },
      { createdById: user.id },
    ];

    if (user.departmentId) {
      orConditions.push({
        audience: "DEPARTMENT",
        departmentId: user.departmentId,
      });
    }

    whereClause.OR = orConditions;
  }

  const announcements = await prisma.announcement.findMany({
    where: whereClause,
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

    const body = await req.json();
    const { title, content, priority = "NORMAL", audience = "EVERYONE", departmentId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const isDepartmentAudience = audience === "DEPARTMENT";
    const targetDeptId = isDepartmentAudience && departmentId && departmentId.trim() !== "" ? departmentId.trim() : null;

    if (isDepartmentAudience && !targetDeptId) {
      return NextResponse.json(
        { error: "A target department must be selected when audience is set to Department." },
        { status: 400 }
      );
    }

    let departmentName = "";
    if (targetDeptId) {
      const dept = await prisma.department.findUnique({
        where: { id: targetDeptId },
        select: { id: true, name: true },
      });
      if (!dept) {
        return NextResponse.json({ error: "Selected department not found." }, { status: 404 });
      }
      departmentName = dept.name;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        priority,
        audience: isDepartmentAudience ? "DEPARTMENT" : "EVERYONE",
        departmentId: targetDeptId,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Notify employees only in the target audience
    const notifyWhere: any = {
      id: { not: user.id },
      status: "ACTIVE",
    };

    if (isDepartmentAudience && targetDeptId) {
      notifyWhere.departmentId = targetDeptId;
    }

    const targetUsers = await prisma.user.findMany({
      where: notifyWhere,
      select: { id: true },
    });

    for (const u of targetUsers) {
      await createNotification({
        data: {
          userId: u.id,
          title: `Announcement: ${title.trim()}`,
          message: content.trim().length > 80 ? content.trim().slice(0, 80) + "..." : content.trim(),
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
      details: `Created announcement: "${title.trim()}" (${priority}, Audience: ${
        isDepartmentAudience ? `Department: ${departmentName}` : "Everyone"
      })`,
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error("Announcement error:", error);
    return NextResponse.json({ error: "Failed to create announcement." }, { status: 500 });
  }
}
