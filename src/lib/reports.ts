import { prisma } from "@/lib/db";
import { formatMinutes, formatTimeIST, getTodayDateString } from "@/lib/utils";
import { getCompanySettings } from "@/lib/config";

function getWorkingDaysBetween(
  startDateStr: string,
  endDateStr: string,
  allowedDays: number[] = [1, 2, 3, 4, 5, 6],
  holidaySet: Set<string> = new Set()
): number {
  const start = new Date(`${startDateStr}T12:00:00Z`);
  const end = new Date(`${endDateStr}T12:00:00Z`);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, "0");
    const d = String(current.getUTCDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    const dayOfWeek = current.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    if (allowedDays.includes(dayOfWeek) && !holidaySet.has(dateKey)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}

export async function getWeeklyReportData({
  startDate,
  endDate,
  departmentId,
  employeeId,
  userRole,
  userId,
}: {
  startDate?: string | null;
  endDate?: string | null;
  departmentId?: string | null;
  employeeId?: string | null;
  userRole?: string;
  userId?: string;
}) {
  const end = endDate || "2026-09-16";
  const start = startDate || "2026-09-10";

  const companySettings = await getCompanySettings();
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => h.date));
  const totalWorkingDays = getWorkingDaysBetween(
    start,
    end,
    companySettings.workingDays,
    holidaySet
  );

  const userWhere: any = { status: "ACTIVE" };
  if (departmentId && departmentId !== "ALL") userWhere.departmentId = departmentId;
  if (employeeId && employeeId !== "ALL") userWhere.id = employeeId;
  if (userRole === "EMPLOYEE" && userId) userWhere.id = userId;

  const employees = await prisma.user.findMany({
    where: userWhere,
    include: {
      department: true,
      attendances: {
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const reportData = employees.map((emp) => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;
    let directAbsent = 0;
    let totalMinutes = 0;

    emp.attendances.forEach((att) => {
      totalMinutes += att.workDurationMinutes;
      if (att.status === "PRESENT") present++;
      else if (att.status === "LATE") {
        present++;
        late++;
      } else if (att.status === "HALF_DAY") halfDay++;
      else if (att.status === "ON_LEAVE") leave++;
      else if (att.status === "ABSENT") directAbsent++;
    });

    const workingDays = totalWorkingDays;
    const calculatedAbsent = Math.max(0, workingDays - present - halfDay - leave);
    const absent = Math.max(directAbsent, calculatedAbsent);
    const activeDays = present + halfDay * 0.5;
    const averageMinutesPerDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    return {
      userId: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || "General",
      workingDays,
      present,
      late,
      halfDay,
      leave,
      absent,
      totalMinutes,
      totalHoursFormatted: formatMinutes(totalMinutes),
      avgHoursFormatted: formatMinutes(averageMinutesPerDay),
    };
  });

  return {
    startDate: start,
    endDate: end,
    report: reportData,
  };
}

export async function getMonthlyReportData({
  month,
  departmentId,
  employeeId,
  userRole,
  userId,
}: {
  month?: string | null;
  departmentId?: string | null;
  employeeId?: string | null;
  userRole?: string;
  userId?: string;
}) {
  const targetMonth = month || "2026-09";
  const [yStr, mStr] = targetMonth.split("-");
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mStr, 10);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const startDate = `${targetMonth}-01`;
  const endDate = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;

  const companySettings = await getCompanySettings();
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => h.date));

  const todayStr = getTodayDateString();
  const isCurrentMonth = todayStr.startsWith(targetMonth);
  const effectiveEndDate = isCurrentMonth && todayStr < endDate ? todayStr : endDate;

  const totalMonthWorkingDays = getWorkingDaysBetween(
    startDate,
    endDate,
    companySettings.workingDays,
    holidaySet
  );

  const elapsedWorkingDays = getWorkingDaysBetween(
    startDate,
    effectiveEndDate,
    companySettings.workingDays,
    holidaySet
  );

  const workingDays = totalMonthWorkingDays;

  const userWhere: any = { status: "ACTIVE" };
  if (departmentId && departmentId !== "ALL") userWhere.departmentId = departmentId;
  if (employeeId && employeeId !== "ALL") userWhere.id = employeeId;
  if (userRole === "EMPLOYEE" && userId) userWhere.id = userId;

  const employees = await prisma.user.findMany({
    where: userWhere,
    include: {
      department: true,
      attendances: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const report = employees.map((emp) => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;
    let directAbsent = 0;
    let totalMinutes = 0;

    emp.attendances.forEach((att) => {
      totalMinutes += att.workDurationMinutes;
      if (att.status === "PRESENT") present++;
      else if (att.status === "LATE") {
        present++;
        late++;
      } else if (att.status === "HALF_DAY") halfDay++;
      else if (att.status === "ON_LEAVE") leave++;
      else if (att.status === "ABSENT") directAbsent++;
    });

    const activeDays = present + halfDay * 0.5;
    const daysToEvaluate = isCurrentMonth ? elapsedWorkingDays : workingDays;
    const calculatedAbsent = Math.max(0, daysToEvaluate - present - halfDay - leave);
    const absent = Math.max(directAbsent, calculatedAbsent);

    const workingDaysForPct = daysToEvaluate > 0 ? daysToEvaluate : workingDays;
    const attendancePercentage =
      workingDaysForPct > 0
        ? Math.min(100, Math.round((activeDays / workingDaysForPct) * 100))
        : 0;

    const avgDailyMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    return {
      userId: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || "General",
      workingDays,
      present,
      absent,
      leave,
      late,
      halfDay,
      totalHoursFormatted: formatMinutes(totalMinutes),
      avgHoursFormatted: formatMinutes(avgDailyMinutes),
      attendancePercentage,
    };
  });

  return {
    month: targetMonth,
    report,
  };
}

export async function getRosterReportData({
  date,
  departmentId,
  statusFilter,
}: {
  date?: string | null;
  departmentId?: string | null;
  statusFilter?: string | null;
}) {
  const targetDate = date || "2026-09-16";

  const userWhere: any = { status: "ACTIVE" };
  if (departmentId && departmentId !== "ALL") userWhere.departmentId = departmentId;

  const employees = await prisma.user.findMany({
    where: userWhere,
    include: {
      department: true,
      attendances: {
        where: { date: targetDate },
        include: { breaks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const records = employees.map((emp) => {
    const att = emp.attendances[0] || null;
    let liveState = "OFFLINE";

    if (!att || (!att.checkIn && att.status !== "ON_LEAVE")) {
      liveState = "OFFLINE";
    } else if (att.status === "ON_LEAVE") {
      liveState = "ON_LEAVE";
    } else if (att.checkIn && !att.checkOut) {
      const hasActiveBreak = att.breaks?.some((b) => b.endTime === null);
      liveState = hasActiveBreak ? "ON_BREAK" : "WORKING";
    } else if (att.checkOut) {
      liveState = "OFFLINE";
    }

    return {
      userId: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || "General",
      designation: emp.designation || "—",
      date: targetDate,
      checkIn: att?.checkIn ? formatTimeIST(att.checkIn) : "—",
      checkOut: att?.checkOut ? formatTimeIST(att.checkOut) : "—",
      workDurationFormatted: formatMinutes(att?.workDurationMinutes || 0),
      breakDurationFormatted: formatMinutes(att?.breakDurationMinutes || 0),
      status: att?.status || "NOT_CHECKED_IN",
      liveState,
    };
  });

  let filtered = records;
  if (statusFilter && statusFilter !== "ALL") {
    filtered = records.filter(
      (r) => r.status === statusFilter || r.liveState === statusFilter
    );
  }

  return {
    date: targetDate,
    records: filtered,
  };
}
