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
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { confirmAction } from "@/components/ui/ConfirmDialog";

interface CalendarViewProps {
  userRole?: string;
}

export default function CalendarView({ userRole }: CalendarViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Add Holiday Modal State (Super Admin)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Default month: Dynamically set to current date
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  const fetchCalendarData = () => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());

    fetchCalendarData();

    // Fetch user for role checking if not passed
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(console.error);
  }, []);

  const isSuperAdmin = userRole === "SUPER_ADMIN" || currentUser?.role === "SUPER_ADMIN";

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

    return { formattedDate, holidays, leaves, projDeadlines };
  };

  const handleOpenAddHoliday = (dateStr: string) => {
    setHolidayDate(dateStr);
    setHolidayName("");
    setIsOptional(false);
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleAddHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim()) {
      setModalError("Please enter a holiday name.");
      return;
    }
    if (!holidayDate) {
      setModalError("Please select a valid date.");
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: holidayName.trim(),
          date: holidayDate,
          isOptional,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setModalError(json.error || "Failed to create holiday");
        return;
      }

      setIsAddModalOpen(false);
      setStatusMessage(`Holiday "${holidayName.trim()}" successfully added!`);
      setTimeout(() => setStatusMessage(null), 4000);
      fetchCalendarData();
    } catch (err: any) {
      setModalError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    const ok = await confirmAction({
      title: "Delete Holiday",
      message: `Are you sure you want to remove the holiday "${name}" from the company calendar?`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/calendar?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMessage(`Holiday "${name}" removed.`);
        setTimeout(() => setStatusMessage(null), 3000);
        fetchCalendarData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
              }}
              className="px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Next Month"
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
                      className="min-h-[96px] p-2 bg-slate-50/40 rounded-xl border border-dashed border-slate-100"
                    ></div>
                  );
                }

                const { formattedDate, holidays, leaves, projDeadlines } = getEventsForDay(dayNum);
                const now = new Date();
                const isToday =
                  currentYear === now.getFullYear() &&
                  currentMonth === now.getMonth() &&
                  dayNum === now.getDate();

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`group min-h-[96px] p-2 rounded-xl border text-xs flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-card ${
                      isToday
                        ? "bg-brand-50/50 border-brand-300 ring-2 ring-brand-200 shadow-2xs hover:ring-brand-300"
                        : "bg-white border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/20"
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

                      <div className="flex items-center gap-1">
                        {isToday && (
                          <span className="text-[9px] font-bold text-brand-600 uppercase">
                            Today
                          </span>
                        )}

                        {/* Super Admin ONLY: + icon in each date column to add holiday */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddHoliday(formattedDate);
                            }}
                            title={`Add holiday for ${formattedDate}`}
                            aria-label={`Add holiday for ${formattedDate}`}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 active:scale-90 transition border border-transparent hover:border-emerald-300"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Event Tags */}
                    <div className="space-y-1 mt-1 flex-1">
                      {holidays.map((h) => (
                        <div
                          key={h.id}
                          className="group/h flex items-center justify-between px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200 shadow-2xs"
                          title={h.isOptional ? `${h.name} (Optional)` : h.name}
                        >
                          <span className="truncate">🎉 {h.name}</span>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHoliday(h.id, h.name);
                              }}
                              className="hidden group-hover/h:inline-flex p-0.5 ml-1 text-emerald-600 hover:text-rose-600 hover:bg-emerald-100 rounded transition shrink-0"
                              title="Delete holiday"
                              aria-label="Delete holiday"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
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

      {/* Super Admin Add Holiday Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 via-brand-500/5 to-transparent border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <PartyPopper className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Public Holiday</h3>
                  <p className="text-[11px] text-slate-500">Super Admin calendar management</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddHolidaySubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Holiday Date
                </label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Diwali, Independence Day, Gandhi Jayanti"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isOptional"
                  checked={isOptional}
                  onChange={(e) => setIsOptional(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isOptional" className="text-xs text-slate-600 select-none cursor-pointer">
                  Optional / Restricted Holiday (Employees can choose)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Holiday
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
