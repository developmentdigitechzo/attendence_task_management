import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";
import { determineCheckInStatus } from "@/lib/attendance";
import { logAuditAction } from "@/lib/audit";
import { sendWorkFromHomeEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTodayDateString();
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      return NextResponse.json(
        { error: "You have already checked in for today." },
        { status: 400 }
      );
    }

    // Parse payload for work type and optional note
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const workType: "Work from Home" | "Office" =
      body.workType === "Work from Home" || body.workType === "HOME"
        ? "Work from Home"
        : "Office";
    const userNotes: string = (body.notes || "").trim();

    const formattedNote =
      workType === "Work from Home"
        ? userNotes
          ? `[Work from Home] ${userNotes}`
          : "[Work from Home]"
        : userNotes
        ? `[Office] ${userNotes}`
        : existing?.notes || null;

    const now = new Date();
    const status = await determineCheckInStatus(now);

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const deviceInfo = req.headers.get("user-agent") || "Web Browser";

    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkIn: now,
            status,
            ipAddress,
            deviceInfo,
            notes: formattedNote,
          },
        })
      : await prisma.attendance.create({
          data: {
            userId: user.id,
            date: today,
            checkIn: now,
            status,
            ipAddress,
            deviceInfo,
            notes: formattedNote,
          },
        });

    // Update user's current work location profile
    await prisma.user.update({
      where: { id: user.id },
      data: { workLocation: workType },
    });

    const timeStrIST = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // If Work from Home, send notification email and in-app alert to Team Lead / Manager
    let emailDelivered = false;
    if (workType === "Work from Home") {
      // Determine reporting lead / manager
      let leadUser = user.manager;

      if (!leadUser) {
        if (user.role === "MANAGER") {
          // If Team Lead checks in from home, notify Super Admin
          leadUser = await prisma.user.findFirst({
            where: { role: "SUPER_ADMIN", status: "ACTIVE" },
            select: { id: true, name: true, email: true },
          });
        } else {
          // For Employee without direct manager, notify any Team Lead / Manager
          leadUser = await prisma.user.findFirst({
            where: { role: "MANAGER", status: "ACTIVE" },
            select: { id: true, name: true, email: true },
          });
        }
      }

      const leadName = leadUser?.name || "Team Lead";
      const leadEmail =
        process.env.LEAD_NOTIFICATION_EMAIL ||
        leadUser?.email ||
        "manimehalaidigitechzo@gmail.com";

      // 1. Send Work from Home notification email
      const emailResult = await sendWorkFromHomeEmail({
        employeeName: user.name,
        employeeEmail: user.email,
        employeeId: user.employeeId,
        departmentName: user.department?.name,
        leadName,
        leadEmail,
        checkInTime: timeStrIST,
        date: today,
        notes: userNotes,
      });

      emailDelivered = emailResult.success;

      // 2. Create In-App notification & web push for the Lead/Manager
      if (leadUser?.id) {
        await createNotification({
          data: {
            userId: leadUser.id,
            title: `🏠 Work From Home: ${user.name}`,
            message: `${user.name} checked in remotely from home today at ${timeStrIST}.${
              userNotes ? ` Note: "${userNotes}"` : ""
            }`,
            type: "SYSTEM",
            linkUrl: user.role === "MANAGER" ? "/admin/attendance" : "/lead/attendance",
          },
        }).catch((err) => console.error("Notification create error:", err));
      }
    }

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: workType === "Work from Home" ? "ATTENDANCE_WFH_CHECK_IN" : "ATTENDANCE_CHECK_IN",
      targetType: "ATTENDANCE",
      targetId: attendance.id,
      details: `Checked in at ${timeStrIST} as ${workType} with status ${status}.${
        workType === "Work from Home" ? ` Lead notified: ${emailDelivered ? "Yes" : "Queued"}` : ""
      }`,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Checked in successfully (${workType}) as ${status}`,
      attendance,
      workType,
      emailDelivered,
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Unable to check in. Please try again." }, { status: 500 });
  }
}
