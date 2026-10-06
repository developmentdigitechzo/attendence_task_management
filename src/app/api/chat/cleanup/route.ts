import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  CHAT_RETENTION_DAYS,
  getRetentionCutoffDate,
  cleanupOldMessages,
  isMonthlyBackupDay,
} from "@/lib/chatRetention";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoffDate = getRetentionCutoffDate();
    const totalMessages = await prisma.message.count();
    const expiredMessagesCount = await prisma.message.count({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const today = new Date();
    const isBackupDay = isMonthlyBackupDay(today);

    return NextResponse.json({
      retentionDays: CHAT_RETENTION_DAYS,
      cutoffDate: cutoffDate.toISOString(),
      totalMessages,
      expiredMessagesCount,
      isBackupDay,
      todayDayOfMonth: today.getDate(),
    });
  } catch (error: any) {
    console.error("[ChatCleanup] Status check error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat retention status." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cleanupOldMessages(true);

    return NextResponse.json({
      message: `Successfully purged ${result.deletedCount} messages older than ${CHAT_RETENTION_DAYS} days.`,
      deletedCount: result.deletedCount,
      cutoffDate: result.cutoffDate.toISOString(),
    });
  } catch (error: any) {
    console.error("[ChatCleanup] Execution error:", error);
    return NextResponse.json(
      { error: "Failed to purge old chat messages." },
      { status: 500 }
    );
  }
}
