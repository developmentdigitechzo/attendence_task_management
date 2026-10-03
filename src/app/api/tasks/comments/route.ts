import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, content } = await req.json();
    if (!taskId || !content?.trim()) {
      return NextResponse.json({ error: "TaskId and content are required." }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error("Task comment error:", error);
    return NextResponse.json({ error: "Failed to add comment." }, { status: 500 });
  }
}
