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
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const projectId = searchParams.get("projectId");
  const assignedToId = searchParams.get("assignedToId");
  const filter = searchParams.get("filter"); // "my", "overdue", "today"

  const where: any = {};

  if (status && status !== "ALL") where.status = status;
  if (priority && priority !== "ALL") where.priority = priority;
  if (projectId && projectId !== "ALL") where.projectId = projectId;

  if (assignedToId && assignedToId !== "ALL") {
    where.assignedToId = assignedToId;
  } else if (filter === "my" || user.role === "EMPLOYEE") {
    where.assignedToId = user.id;
  }

  const now = new Date();
  if (filter === "overdue") {
    where.dueDate = { lt: now };
    where.status = { not: "COMPLETED" };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, client: true } },
      assignedTo: { select: { id: true, name: true, employeeId: true, avatarUrl: true, designation: true } },
      createdBy: { select: { id: true, name: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only admins and managers can create tasks." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      projectId,
      assignedToId,
      priority = "MEDIUM",
      dueDate,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    // Generate unique sequential Task ID
    const count = await prisma.task.count();
    const taskId = `TSK-${String(count + 101).padStart(3, "0")}`;

    const task = await prisma.task.create({
      data: {
        taskId,
        title,
        description,
        projectId: projectId || null,
        assignedToId: assignedToId || null,
        createdById: user.id,
        priority,
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: true,
        project: true,
      },
    });

    // Notify assignee
    if (assignedToId && assignedToId !== user.id) {
      await createNotification({
        data: {
          userId: assignedToId,
          title: "New Task Assigned",
          message: `You were assigned: "${title}" by ${user.name}`,
          type: "TASK_ASSIGNED",
          linkUrl: "/employee/tasks",
        },
      });
    }

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "TASK_CREATED",
      targetType: "TASK",
      targetId: task.id,
      details: `Created task ${task.taskId}: "${task.title}"`,
    });

    return NextResponse.json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error: any) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, priority, assignedToId, title, description, dueDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Employees can only update status and comments of their assigned tasks
    if (user.role === "EMPLOYEE" && existingTask.assignedToId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    // Admins and Managers can edit assignment, priority, title, description, dueDate
    if (user.role !== "EMPLOYEE") {
      if (priority !== undefined) updateData.priority = priority;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: true,
        project: true,
      },
    });

    // Notify assignee when someone else moves their task
    if (
      status !== undefined &&
      status !== existingTask.status &&
      existingTask.assignedToId &&
      existingTask.assignedToId !== user.id
    ) {
      await createNotification({
        data: {
          userId: existingTask.assignedToId,
          title: "Task Status Updated",
          message: `${user.name} moved ${existingTask.taskId} to ${String(status).replace("_", " ")}.`,
          type: "TASK_ASSIGNED",
          linkUrl: "/employee/tasks",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Task updated successfully.",
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}
