"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  CalendarDays,
  FolderGit2,
  Bell,
} from "lucide-react";

export default function CalendarView() {
  const [data, setData] = useState<{
    holidays: any[];
    approvedLeaves: any[];
    projects: any[];
    announcements: any[];
  }>({
    holidays: [],
    approvedLeaves: [],
    projects: [],
    announcements: [],
  });
  const [loading, setLoading] = useState(true);

  // Default month: September 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed: 8 = September

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // Generate calendar days for current month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    days.push(d);
  }

  const getEventsForDay = (dayNum: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

    const holidays = data.holidays.filter((h) => h.date === formattedDate);
    const leaves = data.approvedLeaves.filter(
      (l) => l.startDate <= formattedDate && l.endDate >= formattedDate
    );
    const projDeadlines = data.projects.filter(
      (p) => p.deadline && p.deadline.startsWith(formattedDate)
    );

    return { holidays, leaves, projDeadlines };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Company Calendar & Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Public holidays, approved team leaves, and client project milestones
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Public Holiday
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-500"></span>
            Approved Leave
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            Project Deadline
          </span>
        </div>
      </div>

      {/* Main Calendar View Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 panel-hover">
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(8);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Horizontal Scroll Wrapper for small screens */}
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="min-w-[640px]">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mt-4 text-center text-xs font-semibold text-slate-400 uppercase py-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

        {/* Grid of Calendar Days */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((dayNum, index) => {
            if (!dayNum) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[90px] p-2 bg-slate-50/40 rounded-xl border border-dashed border-slate-100"
                ></div>
              );
            }

            const { holidays, leaves, projDeadlines } = getEventsForDay(dayNum);
            const isToday =
              currentYear === 2026 && currentMonth === 8 && dayNum === 16;

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[90px] p-2 rounded-xl border text-xs flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-card ${
                  isToday
                    ? "bg-brand-50/50 border-brand-300 ring-2 ring-brand-200 shadow-2xs hover:ring-brand-300"
                    : "bg-white border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isToday
                        ? "w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px]"
                        : "text-slate-800"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold text-brand-600 uppercase">
                      Today
                    </span>
                  )}
                </div>

                {/* Event Tags */}
                <div className="space-y-1 mt-1">
                  {holidays.map((h) => (
                    <div
                      key={h.id}
                      className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] truncate border border-emerald-200"
                      title={h.name}
                    >
                      🎉 {h.name}
                    </div>
                  ))}

                  {leaves.map((l) => (
                    <div
                      key={l.id}
                      className="px-1.5 py-0.5 rounded bg-ink-50 text-ink-800 font-semibold text-[10px] truncate border border-ink-200"
                      title={`${l.user?.name}: ${l.type} Leave`}
                    >
                      🏖️ {l.user?.name}
                    </div>
                  ))}

                  {projDeadlines.map((p) => (
                    <div
                      key={p.id}
                      className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 font-semibold text-[10px] truncate border border-brand-200"
                      title={`Deadline: ${p.name}`}
                    >
                      🚀 {p.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
