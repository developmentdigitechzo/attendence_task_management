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
    return NextResponse.json({ error: "Forbidden: Projects are not accessible to employee role." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("id");

  const whereClause: any = {};
  if (projectId) {
    whereClause.id = projectId;
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      tasks: {
        select: {
          id: true,
          taskId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          milestoneId: true,
          assignedTo: {
            select: { id: true, name: true, employeeId: true, avatarUrl: true, designation: true },
          },
        },
        orderBy: { dueDate: "asc" },
      },
      milestones: {
        include: {
          tasks: {
            select: {
              id: true,
              taskId: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignedTo: {
                select: { id: true, name: true, employeeId: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeId: true,
              email: true,
              avatarUrl: true,
              designation: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = projects.map((p) => {
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const formattedMilestones = p.milestones.map((m: any) => {
      const mTotal = m.tasks?.length || 0;
      const mCompleted = m.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
      const mProgress = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : m.status === "COMPLETED" ? 100 : 0;
      return {
        ...m,
        totalTasks: mTotal,
        completedTasks: mCompleted,
        progress: mProgress,
      };
    });

    const totalMilestones = p.milestones.length;
    const completedMilestones = p.milestones.filter((m) => m.status === "COMPLETED").length;

    return {
      ...p,
      totalTasks,
      completedTasks,
      progress,
      totalMilestones,
      completedMilestones,
      milestones: formattedMilestones,
    };
  });

  if (projectId) {
    if (formatted.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project: formatted[0] });
  }

  return NextResponse.json({ projects: formatted });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden. Admin or Team Lead role required." }, { status: 403 });
    }

    const {
      name,
      client,
      description,
      status = "ACTIVE",
      startDate,
      deadline,
      memberIds = [],
    } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    // Prepare member list (ensure creator is included)
    const membersToCreate: { userId: string; role: string }[] = [];
    const memberSet = new Set<string>();

    if (Array.isArray(memberIds)) {
      memberIds.forEach((uid: string) => {
        if (uid && !memberSet.has(uid)) {
          memberSet.add(uid);
          membersToCreate.push({ userId: uid, role: uid === user.id ? "MANAGER" : "MEMBER" });
        }
      });
    }

    if (!memberSet.has(user.id)) {
      membersToCreate.push({ userId: user.id, role: user.role === "SUPER_ADMIN" ? "OWNER" : "MANAGER" });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        client: client ? client.trim() : null,
        description: description ? description.trim() : null,
        managerId: user.id,
        status: status || "ACTIVE",
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        members: {
          create: membersToCreate,
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, employeeId: true, avatarUrl: true },
            },
          },
        },
      },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "PROJECT_CREATED",
      targetType: "PROJECT",
      targetId: project.id,
      details: `Created project: "${name}"`,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden. Admin or Team Lead role required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, client, description, status, startDate, deadline, memberIds } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (client !== undefined) updateData.client = client ? client.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    // If memberIds are provided, update project memberships
    if (Array.isArray(memberIds)) {
      await prisma.projectMember.deleteMany({
        where: { projectId: id },
      });

      const uniqueMemberIds = Array.from(new Set(memberIds)).filter(Boolean) as string[];
      if (!uniqueMemberIds.includes(user.id)) {
        uniqueMemberIds.push(user.id);
      }

      await prisma.projectMember.createMany({
        data: uniqueMemberIds.map((uid) => ({
          projectId: id,
          userId: uid,
          role: uid === user.id ? (user.role === "SUPER_ADMIN" ? "OWNER" : "MANAGER") : "MEMBER",
        })),
      });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, employeeId: true, avatarUrl: true } },
          },
        },
        milestones: true,
        tasks: true,
      },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "PROJECT_UPDATED",
      targetType: "PROJECT",
      targetId: id,
      details: `Updated project "${updated.name}" (Status: ${updated.status})`,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("Project update error:", error);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
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
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Unlink any tasks linked to this project or its milestones
    await prisma.task.updateMany({
      where: { projectId: id },
      data: { projectId: null, milestoneId: null },
    });

    // Delete milestones
    await (prisma as any).milestone.deleteMany({
      where: { projectId: id },
    });

    // Delete project members
    await prisma.projectMember.deleteMany({
      where: { projectId: id },
    });

    // Delete project
    await prisma.project.delete({
      where: { id },
    });

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "PROJECT_DELETED",
      targetType: "PROJECT",
      targetId: id,
      details: `Deleted project "${existing.name}"`,
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Project deletion error:", error);
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 });
  }
}
