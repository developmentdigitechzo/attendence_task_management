import { getCompanySettings } from "./config";

/**
 * Determines attendance status on check-in based on dynamic company settings
 * e.g., workStartTime = "09:00", gracePeriodMinutes = 15 => <= 09:15 is PRESENT, > 09:15 is LATE
 */
export async function determineCheckInStatus(checkInDate: Date): Promise<"PRESENT" | "LATE"> {
  const settings = await getCompanySettings();
  const [startHourStr, startMinStr] = settings.workStartTime.split(":");
  const startHour = parseInt(startHourStr, 10);
  const startMin = parseInt(startMinStr, 10);

  // Convert checkInDate to company timezone (Asia/Kolkata)
  const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: settings.timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = timeFormatter.formatToParts(checkInDate);
  const checkHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const checkMin = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

  const checkTotalMinutes = checkHour * 60 + checkMin;
  const cutoffMinutes = startHour * 60 + startMin + settings.gracePeriodMinutes;

  if (checkTotalMinutes > cutoffMinutes) {
    return "LATE";
  }
  return "PRESENT";
}

/**
 * Calculates work minutes from checkIn to checkOut minus total break minutes
 */
export function calculateWorkingMinutes(
  checkIn: Date,
  checkOut: Date,
  breakMinutes: number = 0
): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const totalMin = Math.floor(diffMs / (1000 * 60));
  const workMin = Math.max(0, totalMin - breakMinutes);
  return workMin;
}
