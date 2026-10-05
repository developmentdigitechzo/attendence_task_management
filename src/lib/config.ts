import { prisma } from "./db";

export const DEFAULT_CONFIG = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Digitechzo WorkOS",
  appSubtitle:
    process.env.NEXT_PUBLIC_APP_SUBTITLE ||
    "Internal Employee Management & Productivity System",
  workStartTime: "10:00",
  workEndTime: "19:00",
  gracePeriodMinutes: 15,
  timezone: "Asia/Kolkata",
  workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

export async function getCompanySettings() {
  try {
    const settings = await prisma.companySetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return {
      appName: map.companyName || DEFAULT_CONFIG.appName,
      appSubtitle: map.subtitle || DEFAULT_CONFIG.appSubtitle,
      workStartTime: map.workStartTime || DEFAULT_CONFIG.workStartTime,
      workEndTime: map.workEndTime || DEFAULT_CONFIG.workEndTime,
      gracePeriodMinutes: parseInt(map.gracePeriodMinutes || "15", 10),
      timezone: map.timezone || DEFAULT_CONFIG.timezone,
      workingDays: (map.workingDays || "1,2,3,4,5,6")
        .split(",")
        .map((d) => parseInt(d.trim(), 10)),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
