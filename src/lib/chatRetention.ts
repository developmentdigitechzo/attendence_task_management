import { prisma } from "@/lib/db";
import {
  CHAT_RETENTION_DAYS,
  getRetentionCutoffDate,
  isMonthlyBackupDay,
} from "./chatRetentionConstants";

export { CHAT_RETENTION_DAYS, getRetentionCutoffDate, isMonthlyBackupDay };

// In-memory throttling so cleanup query doesn't execute on every single rapid polling request
let lastCleanupTimestamp = 0;
const CLEANUP_THROTTLE_MS = 30 * 60 * 1000; // Run at most once every 30 minutes

/**
 * Erases chat messages older than 100 days.
 * Message reactions are automatically deleted via Prisma schema cascade.
 */
export async function cleanupOldMessages(force = false): Promise<{
  deletedCount: number;
  cutoffDate: Date;
  skipped: boolean;
}> {
  const now = Date.now();
  if (!force && now - lastCleanupTimestamp < CLEANUP_THROTTLE_MS) {
    return {
      deletedCount: 0,
      cutoffDate: getRetentionCutoffDate(),
      skipped: true,
    };
  }

  const cutoffDate = getRetentionCutoffDate();

  try {
    const result = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    lastCleanupTimestamp = now;

    if (result.count > 0) {
      console.log(
        `[ChatRetention] Auto-erased ${result.count} messages older than ${CHAT_RETENTION_DAYS} days (cutoff: ${cutoffDate.toISOString()})`
      );
    }

    return {
      deletedCount: result.count,
      cutoffDate,
      skipped: false,
    };
  } catch (error) {
    console.error("[ChatRetention] Error during message cleanup:", error);
    return {
      deletedCount: 0,
      cutoffDate,
      skipped: false,
    };
  }
}
