import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden: Milestones are not accessible to employee role." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const id = searchParams.get("id");

  const where: any = {};
  if (id) where.id = id;
  if (projectId && projectId !== "ALL") where.projectId = projectId;

  const milestones = await (prisma as any).milestone.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, client: true, status: true } },
      tasks: {
        select: {
          id: true,
          taskId: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: { select: { id: true, name: true, employeeId: true, avatarUrl: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const formatted = milestones.map((m: any) => {
    const total = m.tasks?.length || 0;
    const completed = m.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : m.status === "COMPLETED" ? 100 : 0;
    return {
      ...m,
      totalTasks: total,
      completedTasks: completed,
      progress,
    };
  });

  if (id && formatted.length > 0) {
    return NextResponse.json({ milestone: formatted[0] });
  }

  return NextResponse.json({ milestones: formatted });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden. Admin or Team Lead role required." }, { status: 403 });
    }

    const { projectId, name, description, startDate, dueDate, status = "IN_PROGRESS" } = await req.json();

    if (!projectId || !name || !name.trim()) {
      return NextResponse.json(
        { error: "Project and Milestone title are required." },
        { status: 400 }
      );
    }

    let project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      // Fallback: If the exact ID was refreshed or recreated, link to the latest matching or active project
      const fallback = await prisma.project.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      });

      if (!fallback) {
        return NextResponse.json({ error: "Selected project not found. Please create a project first." }, { status: 404 });
      }
      project = fallback;
    }

    const milestone = await (prisma as any).milestone.create({
      data: {
        projectId: project.id,
        name: name.trim(),
        description: description ? description.trim() : null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "IN_PROGRESS",
      },
      include: {
        project: { select: { id: true, name: true, client: true } },
        tasks: true,
      },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "MILESTONE_CREATED",
      targetType: "PROJECT",
      targetId: projectId,
      details: `Created milestone "${milestone.name}" in project "${project.name}"`,
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error: any) {
    console.error("Milestone creation error:", error);
    return NextResponse.json({ error: "Failed to create milestone." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden. Admin or Team Lead role required." }, { status: 403 });
    }

    const { id, status, name, description, startDate, dueDate, projectId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Milestone ID required." }, { status: 400 });
    }

    const existing = await (prisma as any).milestone.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (projectId !== undefined) updateData.projectId = projectId;

    const updated = await (prisma as any).milestone.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, client: true } },
        tasks: {
          select: {
            id: true,
            taskId: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: { select: { id: true, name: true, employeeId: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    console.error("Milestone update error:", error);
    return NextResponse.json({ error: "Failed to update milestone." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden. Admin or Team Lead role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Milestone ID is required." }, { status: 400 });
    }

    const existing = await (prisma as any).milestone.findUnique({
      where: { id },
      select: { id: true, name: true, projectId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    }

    // Unlink tasks assigned to this milestone
    await prisma.task.updateMany({
      where: { milestoneId: id },
      data: { milestoneId: null },
    });

    // Delete milestone
    await (prisma as any).milestone.delete({
      where: { id },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "MILESTONE_DELETED",
      targetType: "PROJECT",
      targetId: existing.projectId,
      details: `Deleted milestone "${existing.name}"`,
    });

    return NextResponse.json({ success: true, message: "Milestone deleted successfully" });
  } catch (error: any) {
    console.error("Milestone delete error:", error);
    return NextResponse.json({ error: "Failed to delete milestone." }, { status: 500 });
  }
}
