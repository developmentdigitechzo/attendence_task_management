import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatTimeIST(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return "--:--";
  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateDisplay(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return "--";
  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return String(dateStringOrDate);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function getTodayDateString(): string {
  // Return YYYY-MM-DD in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return "--:--";
  if (/am|pm/i.test(timeStr)) return timeStr;
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    const m = parts[1].padStart(2, "0").slice(0, 2);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${m} ${period}`;
  }
  return timeStr;
}

export function formatWorkingHours(hoursStr?: string | null): string {
  if (!hoursStr || hoursStr.includes("09:00") || hoursStr.includes("18:00")) {
    return "10:00 AM - 07:00 PM";
  }
  if (/am|pm/i.test(hoursStr)) return hoursStr;
  const parts = hoursStr.split("-").map((p) => p.trim());
  if (parts.length === 2) {
    return `${formatTime12h(parts[0])} - ${formatTime12h(parts[1])}`;
  }
  return hoursStr;
}

