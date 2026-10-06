/**
 * Chat retention and monthly backup schedule constants and utilities (Client & Server safe).
 */
export const CHAT_RETENTION_DAYS = 100;

/**
 * Computes the retention cutoff date (100 days ago).
 */
export function getRetentionCutoffDate(retentionDays = CHAT_RETENTION_DAYS): Date {
  return new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Checks whether a given date is the 30th day of the month
 * (or the last day of February if February has 28/29 days).
 */
export function isMonthlyBackupDay(date = new Date()): boolean {
  const day = date.getDate();
  if (day === 30) return true;

  // In February, there is no 30th day, so check if it's the last day of February
  const month = date.getMonth(); // 1 = February
  if (month === 1) {
    const lastDayOfFeb = new Date(date.getFullYear(), 2, 0).getDate();
    if (day === lastDayOfFeb) return true;
  }

  return false;
}
