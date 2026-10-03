import { prisma } from "./db";

export async function logAuditAction({
  userId,
  userName,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
}: {
  userId?: string;
  userName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        targetType,
        targetId,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
