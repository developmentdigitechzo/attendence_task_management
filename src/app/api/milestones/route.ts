import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where: any = {};
  if (projectId) where.projectId = projectId;

  const milestones = await (prisma as any).milestone.findMany({
    where,
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
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const formatted = milestones.map((m: any) => {
    const total = m.tasks.length;
    const completed = m.tasks.filter((t: any) => t.status === "COMPLETED").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...m,
      totalTasks: total,
      completedTasks: completed,
      progress,
    };
  });

  return NextResponse.json({ milestones: formatted });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { projectId, name, description, startDate, dueDate } = await req.json();

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Project ID and Milestone name are required." },
        { status: 400 }
      );
    }

    const milestone = await (prisma as any).milestone.create({
      data: {
        projectId,
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "IN_PROGRESS",
      },
      include: {
        project: true,
      },
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status, name, description, dueDate } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Milestone ID required." }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updated = await (prisma as any).milestone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    console.error("Milestone update error:", error);
    return NextResponse.json({ error: "Failed to update milestone." }, { status: 500 });
  }
}
