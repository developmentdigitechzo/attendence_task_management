import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get channel messages count in channels where user is a member
  const userChannels = await prisma.channelMember.findMany({
    where: { userId: user.id },
    select: { channelId: true },
  });

  const channelIds = userChannels.map((cm) => cm.channelId);

  const channelMessageCounts = await prisma.message.groupBy({
    by: ["channelId"],
    where: { channelId: { in: channelIds } },
    _count: true,
  });

  const channelCounts: Record<string, number> = {};
  let totalChannelMessages = 0;
  channelMessageCounts.forEach((c) => {
    if (c.channelId) {
      channelCounts[c.channelId] = c._count;
      totalChannelMessages += c._count;
    }
  });

  // 2. Get direct message count for user (sent or received)
  const dmMessages = await prisma.message.count({
    where: {
      OR: [{ recipientId: user.id }, { senderId: user.id }],
    },
  });

  // 3. Count unread chat notifications
  const unreadChatNotifications = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
      type: "CHAT_MESSAGE",
    },
  });

  const totalMessages = totalChannelMessages + dmMessages;

  return NextResponse.json({
    totalMessages,
    unreadChatNotifications,
    channelCounts,
    dmMessages,
  });
}
