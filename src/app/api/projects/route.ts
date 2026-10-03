import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        select: { id: true, status: true, priority: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, employeeId: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = projects.map((p) => {
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      ...p,
      totalTasks,
      completedTasks,
      progress,
    };
  });

  return NextResponse.json({ projects: formatted });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, client, description, startDate, deadline, memberIds } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        client,
        description,
        managerId: user.id,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: "ACTIVE",
        members: {
          create: Array.isArray(memberIds)
            ? memberIds.map((uid: string) => ({ userId: uid, role: "MEMBER" }))
            : [{ userId: user.id, role: "MANAGER" }],
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
