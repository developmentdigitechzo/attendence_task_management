import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, emoji } = await req.json();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji are required." }, { status: 400 });
    }

    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ success: true, action: "removed" });
    } else {
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji,
        },
      });
      return NextResponse.json({ success: true, action: "added", reaction });
    }
  } catch (error: any) {
    console.error("Reaction toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle reaction." }, { status: 500 });
  }
}
