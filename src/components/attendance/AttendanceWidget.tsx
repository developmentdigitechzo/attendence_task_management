"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  Flame,
} from "lucide-react";
import { formatMinutes, formatTimeIST } from "@/lib/utils";
import CorrectionModal from "./CorrectionModal";
import CheckInModal from "./CheckInModal";
import { confirmAction } from "@/components/ui/ConfirmDialog";

interface AttendanceWidgetProps {
  userName: string;
  onStatusChange?: () => void;
}

export default function AttendanceWidget({
  userName,
  onStatusChange,
}: AttendanceWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [attendance, setAttendance] = useState<any>(null);
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [totalBreakSeconds, setTotalBreakSeconds] = useState(0);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
        setActiveBreak(data.activeBreak);

        // 1. Calculate total completed break seconds from all break records
        let completedBreakSec = 0;
        if (data.attendance?.breaks && Array.isArray(data.attendance.breaks)) {
          for (const b of data.attendance.breaks) {
            if (b.endTime && b.startTime) {
              const diff = Math.floor(
                (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000
              );
              completedBreakSec += Math.max(0, diff);
            } else if (b.durationMinutes && b.endTime) {
              completedBreakSec += b.durationMinutes * 60;
            }
          }
        } else if (data.attendance?.breakDurationMinutes) {
          completedBreakSec = data.attendance.breakDurationMinutes * 60;
        }

        // 2. Calculate current active break seconds if ongoing
        let currentActiveBreakSec = 0;
        if (data.activeBreak) {
          const breakStartMs = new Date(data.activeBreak.startTime).getTime();
          currentActiveBreakSec = Math.max(0, Math.floor((Date.now() - breakStartMs) / 1000));
          setBreakSeconds(currentActiveBreakSec);
        } else {
          setBreakSeconds(0);
        }

        const totalBreakSec = completedBreakSec + currentActiveBreakSec;
        setTotalBreakSeconds(totalBreakSec);

        // 3. Calculate initial net working seconds from checkIn (total elapsed minus total break)
        if (data.attendance?.checkIn && !data.attendance?.checkOut) {
          const startMs = new Date(data.attendance.checkIn).getTime();
          const nowMs = Date.now();
          const totalElapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          const netWorkingSec = Math.max(0, totalElapsedSec - totalBreakSec);
          setElapsedSeconds(netWorkingSec);
        } else if (data.attendance?.checkOut) {
          setElapsedSeconds((data.attendance.workDurationMinutes || 0) * 60);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  // Live timer tick
  useEffect(() => {
    if (!attendance?.checkIn || attendance?.checkOut) return;

    const interval = setInterval(() => {
      if (activeBreak) {
        setBreakSeconds((prev) => prev + 1);
        setTotalBreakSeconds((prev) => prev + 1);
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attendance, activeBreak]);

  const handleCheckInSuccess = (data: any) => {
    setMessage({ text: data.message || "Checked in successfully!", type: "success" });
    fetchTodayAttendance();
    onStatusChange?.();
  };

  const handleCheckOut = async () => {
    const confirmed = await confirmAction({
      title: "Confirm Check Out",
      message: "Are you sure you want to check out for today? This will record your punch out time.",
      confirmText: "Check Out",
      variant: "danger",
    });
    if (!confirmed) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Failed to check out.", type: "error" });
      } else {
        setMessage({ text: data.message, type: "success" });
        await fetchTodayAttendance();
        onStatusChange?.();
      }
    } catch {
      setMessage({ text: "Network error checking out.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreak = async (action: "start" | "end") => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Failed to process break.", type: "error" });
      } else {
        setMessage({ text: data.message, type: "success" });
        await fetchTodayAttendance();
        onStatusChange?.();
      }
    } catch {
      setMessage({ text: "Network error.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  const isCheckedIn = Boolean(attendance?.checkIn);
  const isCheckedOut = Boolean(attendance?.checkOut);
  const isOnBreak = Boolean(activeBreak);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Good Morning, {userName}! 👋
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Office hours: 10:00 AM – 07:00 PM • Attendance & Break Tracking
          </p>
        </div>

        {/* Current State Badge */}
        <div className="flex items-center gap-2">
          {!isCheckedIn && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Not Checked In
            </span>
          )}
          {isCheckedIn && !isCheckedOut && !isOnBreak && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Working ({attendance.status === "LATE" ? "Late Arrival" : "On Time"})
            </span>
          )}
          {isCheckedIn && !isCheckedOut && isOnBreak && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              On Break
            </span>
          )}
          {isCheckedOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
              Checked Out ({attendance.status})
            </span>
          )}
          {isCheckedIn && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                attendance?.notes?.includes("Work from Home")
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {attendance?.notes?.includes("Work from Home") ? "🏠 Work from Home" : "🏢 Office"}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Check In Time</p>
          <p className="text-base font-semibold text-slate-800 mt-1">
            {formatTimeIST(attendance?.checkIn)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Punch in timestamp</p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Check Out Time</p>
          <p className="text-base font-semibold text-slate-800 mt-1">
            {formatTimeIST(attendance?.checkOut)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isCheckedOut ? "Work day finished" : "In progress"}
          </p>
        </div>

        <div className="bg-brand-50/50 p-3.5 rounded-xl border border-brand-100/60">
          <p className="text-[11px] font-medium text-brand-600 uppercase tracking-wider">Working Duration</p>
          <p className="text-base font-mono font-bold text-brand-900 mt-1">
            {formatTimer(elapsedSeconds)}
          </p>
          <p className="text-[10px] text-brand-600 mt-0.5 font-medium">
            {isOnBreak ? "⏸️ Paused during break" : "▶️ Active work counting"}
          </p>
        </div>

        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100/60">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Total Break Time</p>
          <p className="text-base font-mono font-bold text-amber-900 mt-1">
            {formatTimer(totalBreakSeconds)}
          </p>
          <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
            {isOnBreak
              ? "⚡ Break counting live..."
              : `${attendance?.breaks?.length || 0} break${attendance?.breaks?.length === 1 ? "" : "s"} accumulated`}
          </p>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {!isCheckedIn ? (
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            disabled={actionLoading}
            className="flex-1 min-w-[200px] h-12 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>CHECK IN</span>
          </button>
        ) : !isCheckedOut ? (
          <>
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="flex-1 min-w-[160px] h-12 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition disabled:opacity-50"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>CHECK OUT</span>
            </button>

            {!isOnBreak ? (
              <button
                onClick={() => handleBreak("start")}
                disabled={actionLoading}
                className="flex-1 min-w-[160px] h-12 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Coffee className="w-4 h-4" />
                <span>START BREAK</span>
              </button>
            ) : (
              <button
                onClick={() => handleBreak("end")}
                disabled={actionLoading}
                className="flex-1 min-w-[160px] h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>END BREAK</span>
              </button>
            )}
          </>
        ) : (
          <div className="w-full text-center py-2 text-xs text-slate-500 font-medium">
            ✅ You have checked out for today. Great work!
          </div>
        )}

        {/* Correction link */}
        <button
          onClick={() => setIsCorrectionModalOpen(true)}
          className="px-4 h-12 text-xs font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Attendance Correction</span>
        </button>
      </div>

      {/* Today's Breaks Breakdown (Every break taken today is calculated & listed) */}
      {attendance?.breaks && attendance.breaks.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today&apos;s Breaks ({attendance.breaks.length}) • All Accumulated
            </p>
            <span className="text-[11px] font-semibold text-amber-700 font-mono">
              Total: {formatTimer(totalBreakSeconds)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attendance.breaks.map((b: any, idx: number) => {
              const isOngoing = b.endTime === null;
              const breakSecs = isOngoing
                ? breakSeconds
                : b.endTime && b.startTime
                ? Math.max(0, Math.floor((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000))
                : (b.durationMinutes || 0) * 60;

              return (
                <div
                  key={b.id || idx}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                    isOngoing
                      ? "bg-amber-50 text-amber-900 border-amber-300 font-semibold ring-1 ring-amber-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-semibold">Break {idx + 1}:</span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {formatTimeIST(b.startTime)} – {isOngoing ? "Ongoing" : formatTimeIST(b.endTime)}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      isOngoing
                        ? "bg-amber-200 text-amber-900 animate-pulse"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {formatTimer(breakSecs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCorrectionModalOpen && (
        <CorrectionModal
          onClose={() => setIsCorrectionModalOpen(false)}
          onSuccess={() => {
            fetchTodayAttendance();
            setMessage({ text: "Correction request submitted successfully.", type: "success" });
          }}
        />
      )}

      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSuccess={handleCheckInSuccess}
      />
    </div>
  );
}
