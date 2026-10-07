import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, optionId } = await req.json();
    if (!messageId || !optionId) {
      return NextResponse.json({ error: "Missing messageId or optionId." }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || !message.attachments) {
      return NextResponse.json({ error: "Message or poll not found." }, { status: 404 });
    }

    let attachments: any[] = [];
    try {
      attachments = JSON.parse(message.attachments);
    } catch {
      return NextResponse.json({ error: "Invalid poll attachments format." }, { status: 400 });
    }

    const pollIndex = attachments.findIndex(
      (a) => a && (a.type === "poll" || (Boolean(a.question) && Array.isArray(a.options)))
    );
    if (pollIndex === -1) {
      return NextResponse.json({ error: "No poll found in this message." }, { status: 404 });
    }

    const poll = attachments[pollIndex];
    if (!poll.type) {
      poll.type = "poll";
    }

    // Update votes: each option has votes: string[] (array of user IDs)
    poll.options = poll.options.map((opt: any) => {
      const currentVotes: string[] = Array.isArray(opt.votes) ? opt.votes : [];
      if (opt.id === optionId) {
        // Toggle vote: if already voted, remove; if not voted, add
        if (currentVotes.includes(user.id)) {
          return { ...opt, votes: currentVotes.filter((id) => id !== user.id) };
        } else {
          return { ...opt, votes: [...currentVotes, user.id] };
        }
      } else {
        // Single choice: remove user vote from other options
        return { ...opt, votes: currentVotes.filter((id) => id !== user.id) };
      }
    });

    attachments[pollIndex] = poll;

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { attachments: JSON.stringify(attachments) },
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

    return NextResponse.json({ success: true, message: updated, poll });
  } catch (error: any) {
    console.error("Poll vote error:", error);
    return NextResponse.json({ error: "Failed to cast vote." }, { status: 500 });
  }
}
