import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.companySetting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });

  return NextResponse.json({ settings: map });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    const { companyName, subtitle, workStartTime, workEndTime, gracePeriodMinutes, timezone, workingDays } =
      await req.json();

    const updates = [
      { key: "companyName", value: companyName },
      { key: "subtitle", value: subtitle },
      { key: "workStartTime", value: workStartTime },
      { key: "workEndTime", value: workEndTime },
      { key: "gracePeriodMinutes", value: String(gracePeriodMinutes) },
      { key: "timezone", value: timezone },
      { key: "workingDays", value: workingDays },
    ];

    for (const item of updates) {
      if (item.value !== undefined) {
        await prisma.companySetting.upsert({
          where: { key: item.key },
          create: { key: item.key, value: item.value },
          update: { value: item.value },
        });
      }
    }

    await logAuditAction({
      userId: user.id,
      userName: user.name,
      action: "COMPANY_SETTINGS_UPDATED",
      targetType: "SETTING",
      details: "Updated company settings (hours, grace period, branding)",
    });

    return NextResponse.json({
      success: true,
      message: "Company settings updated successfully.",
    });
  } catch (error: any) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
