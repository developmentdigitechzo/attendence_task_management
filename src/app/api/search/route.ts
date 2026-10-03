import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({
      results: {
        employees: [],
        tasks: [],
        projects: [],
        departments: [],
      },
    });
  }

  try {
    const [employees, tasks, projects, departments] = await Promise.all([
      // Employees
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { employeeId: { contains: q } },
            { designation: { contains: q } },
            { phone: { contains: q } },
          ],
        },
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          phone: true,
          designation: true,
          role: true,
          status: true,
          workLocation: true,
          workingHours: true,
          skills: true,
          bio: true,
          department: { select: { id: true, name: true, code: true } },
          manager: { select: { id: true, name: true } },
        },
        take: 6,
      }),

      // Tasks
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { taskId: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: {
          id: true,
          taskId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          startDate: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        take: 6,
      }),

      // Projects
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { client: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          client: true,
          description: true,
          status: true,
          startDate: true,
          deadline: true,
        },
        take: 6,
      }),

      // Departments
      prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { code: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          _count: { select: { users: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      results: {
        employees,
        tasks,
        projects,
        departments,
      },
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to execute search" },
      { status: 500 }
    );
  }
}
