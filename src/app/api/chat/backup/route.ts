import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CHAT_RETENTION_DAYS, getRetentionCutoffDate } from "@/lib/chatRetention";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    const where: any = {};
    if (channelId) {
      where.channelId = channelId;
    } else {
      // Return messages for all channels and DMs involving this user
      where.OR = [
        { channelId: { not: null } },
        { senderId: user.id },
        { recipientId: user.id },
      ];
    }

    // Fetch channels info
    const channels = await prisma.channel.findMany({
      select: {
        id: true,
        name: true,
        topic: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    // Fetch messages
    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            designation: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Clean and parse attachments if they are JSON strings
    const formattedMessages = messages.map((m) => {
      let parsedAttachments: any = null;
      if (m.attachments) {
        try {
          parsedAttachments = JSON.parse(m.attachments);
        } catch {
          parsedAttachments = m.attachments;
        }
      }

      return {
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        channelName: m.channel ? `#${m.channel.name}` : "Direct Message",
        channelId: m.channelId,
        recipientId: m.recipientId,
        sender: {
          id: m.sender.id,
          name: m.sender.name,
          email: m.sender.email,
          employeeId: m.sender.employeeId,
          designation: m.sender.designation,
        },
        content: m.content,
        attachments: parsedAttachments,
        reactions: m.reactions.map((r) => ({
          emoji: r.emoji,
          userName: r.user.name,
        })),
      };
    });

    const cutoffDate = getRetentionCutoffDate();
    const nowIso = new Date().toISOString();
    const dateFormatted = new Date().toISOString().split("T")[0];

    const backupPayload = {
      system: "Digitechzo WorkOS Chat Backup",
      exportTimestamp: nowIso,
      retentionPolicyNotice: `All chat messages older than ${CHAT_RETENTION_DAYS} days are automatically erased. Next cutoff: ${cutoffDate.toISOString()}`,
      retentionDays: CHAT_RETENTION_DAYS,
      retentionCutoffDate: cutoffDate.toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      channelCount: channels.length,
      channels,
      totalMessagesExported: formattedMessages.length,
      messages: formattedMessages,
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="chat_backup_${dateFormatted}.json"`,
      },
    });
  } catch (error: any) {
    console.error("[ChatBackup] Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate chat backup." },
      { status: 500 }
    );
  }
}
