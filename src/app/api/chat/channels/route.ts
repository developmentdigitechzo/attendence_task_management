import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channels = await prisma.channel.findMany({
    include: {
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { name: "asc" },
  });

  const formattedChannels = channels.map((c) => ({
    ...c,
    messageCount: c._count?.messages || 0,
  }));

  // Direct message contacts: all other active employees with message count
  const directContacts = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      avatarUrl: true,
      lastActiveAt: true,
    },
    orderBy: { name: "asc" },
  });

  const directContactsWithCount = await Promise.all(
    directContacts.map(async (c) => {
      const count = await prisma.message.count({
        where: {
          OR: [
            { senderId: user.id, recipientId: c.id },
            { senderId: c.id, recipientId: user.id },
          ],
        },
      });
      return {
        ...c,
        messageCount: count,
      };
    })
  );

  const totalChannelMessages = formattedChannels.reduce((sum, ch) => sum + ch.messageCount, 0);
  const totalDmMessages = directContactsWithCount.reduce((sum, c) => sum + c.messageCount, 0);
  const totalMessages = totalChannelMessages + totalDmMessages;

  return NextResponse.json({
    channels: formattedChannels,
    directContacts: directContactsWithCount,
    totalMessages,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, topic } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Channel name is required." }, { status: 400 });
    }

    const sanitized = name.toLowerCase().replace(/[^a-z0-9-_]/g, "");

    const channel = await prisma.channel.create({
      data: {
        name: sanitized,
        topic,
        createdById: user.id,
      },
    });

    // Add all active users to the channel
    const allUsers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });

    for (const u of allUsers) {
      await prisma.channelMember.create({
        data: { channelId: channel.id, userId: u.id },
      });
    }

    return NextResponse.json({ success: true, channel });
  } catch (error: any) {
    console.error("Create channel error:", error);
    return NextResponse.json({ error: "Failed to create channel." }, { status: 500 });
  }
}
