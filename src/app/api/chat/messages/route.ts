import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { cleanupOldMessages } from "@/lib/chatRetention";

export async function GET(req: NextRequest) {
  // Opportunistically clean up messages older than 100 days (throttled to once per 30 mins)
  cleanupOldMessages().catch(() => {});

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const recipientId = searchParams.get("recipientId");
  const search = searchParams.get("search");

  const where: any = {};

  if (channelId) {
    where.channelId = channelId;
  } else if (recipientId) {
    // Direct message condition: (sender=user AND recipient=other) OR (sender=other AND recipient=user)
    where.OR = [
      { senderId: user.id, recipientId: recipientId },
      { senderId: recipientId, recipientId: user.id },
    ];
  } else {
    return NextResponse.json({ error: "Specify channelId or recipientId" }, { status: 400 });
  }

  if (search) {
    where.content = { contains: search };
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          employeeId: true,
          designation: true,
        },
      },
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId, recipientId, content, attachments, replyToId } = await req.json();

    const textContent = (content || "").trim();
    if (!textContent && !attachments) {
      return NextResponse.json(
        { error: "Message content or an attachment is required." },
        { status: 400 }
      );
    }

    const attachmentsString =
      typeof attachments === "object" ? JSON.stringify(attachments) : attachments || null;

    // Generate descriptive fallback content if only attachments are sent
    let fallbackText = textContent;
    if (!fallbackText && attachmentsString) {
      if (attachmentsString.includes('"type":"image"')) fallbackText = "📷 Shared an image";
      else if (attachmentsString.includes('"type":"document"')) fallbackText = "📄 Shared a document";
      else if (attachmentsString.includes('"type":"location"')) fallbackText = "📍 Shared a location";
      else if (attachmentsString.includes('"type":"poll"')) fallbackText = "📊 Created a poll";
      else fallbackText = "📎 Sent an attachment";
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        channelId: channelId || null,
        recipientId: recipientId || null,
        content: fallbackText,
        attachments: attachmentsString,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            employeeId: true,
            designation: true,
          },
        },
        reactions: true,
      },
    });

    // 1. If Channel Message, notify all other channel members via push & in-app notifications
    if (channelId) {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { id: true, name: true },
      });

      const members = await prisma.channelMember.findMany({
        where: {
          channelId,
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      let recipientUserIds = members.map((m) => m.userId);

      // If channel has no specific member list (public channel), notify all other active team members
      if (recipientUserIds.length === 0) {
        const allUsers = await prisma.user.findMany({
          where: {
            id: { not: user.id },
            status: "ACTIVE",
          },
          select: { id: true },
        });
        recipientUserIds = allUsers.map((u) => u.id);
      }

      const preview = content.length > 75 ? content.slice(0, 75) + "..." : content;
      const channelName = channel?.name || "chat";

      await Promise.all(
        recipientUserIds.map(async (uid) => {
          try {
            await createNotification({
              data: {
                userId: uid,
                title: `#${channelName} • ${user.name}`,
                message: preview,
                type: "CHAT_MESSAGE",
                linkUrl: `/chat?channelId=${channelId}`,
              },
            });
          } catch (e) {
            console.error("Push notify member error:", e);
          }
        })
      );
    }

    // 2. If Direct Message, send push and notification to recipient
    if (recipientId) {
      const preview = content.length > 75 ? content.slice(0, 75) + "..." : content;
      await createNotification({
        data: {
          userId: recipientId,
          title: `Message from ${user.name}`,
          message: preview,
          type: "CHAT_MESSAGE",
          linkUrl: `/chat?recipientId=${user.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Post message error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, isPinned, content } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }
    if (content !== undefined) {
      if (existing.senderId !== user.id && user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Cannot edit someone else's message." }, { status: 403 });
      }
      updateData.content = content.trim();
      updateData.editedAt = new Date();
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    console.error("Message update error:", error);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    if (!messageId) {
      return NextResponse.json({ error: "Message ID required." }, { status: 400 });
    }

    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    if (existing.senderId !== user.id && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot delete this message." }, { status: 403 });
    }

    await prisma.message.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Message delete error:", error);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }
}
