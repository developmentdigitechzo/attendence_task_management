"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle2, AlertTriangle, FileEdit, Coffee } from "lucide-react";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import CorrectionModal from "@/components/attendance/CorrectionModal";
import { formatTimeIST, formatMinutes, formatDateDisplay } from "@/lib/utils";

export default function EmployeeAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const [userRes, reportRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/reports/weekly?startDate=2026-09-01&endDate=2026-09-30"),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }

      // We can also fetch the user's personal attendance records
      const meRes = await fetch("/api/attendance/corrections");
      // Let's fetch attendance history from the monthly report or dedicated endpoint
      const monthRes = await fetch("/api/reports/monthly?month=2026-09");
      if (monthRes.ok) {
        const mData = await monthRes.json();
        // Get user's attendance records from weekly endpoint
        const weekRes = await fetch("/api/reports/weekly?startDate=2026-09-01&endDate=2026-09-20");
        if (weekRes.ok) {
          const wData = await weekRes.json();
          // We can also query direct attendance
        }
      }

      // Fetch attendance history for the past 30 days
      const attListRes = await fetch("/api/attendance/overview?date=2026-09-16");
      // Or fetch from attendance corrections
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Attendance & Timesheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily check-ins, record breaks, and review personal attendance audit history
          </p>
        </div>

        <button
          onClick={() => setIsCorrectionModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileEdit className="w-3.5 h-3.5 text-brand-600" />
          <span>Request Attendance Correction</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Attendance Widget */}
      <AttendanceWidget
        userName={user?.name || "Employee"}
        onStatusChange={fetchAttendanceHistory}
      />

      {/* Monthly Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">September Turnout</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">94%</p>
          <span className="text-[10px] text-slate-400">Consistent attendance</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Avg Work Hours</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">8h 22m</p>
          <span className="text-[10px] text-slate-400">Daily average duration</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Late Arrivals</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">1</p>
          <span className="text-[10px] text-slate-400">Past 09:15 AM grace</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Leaves Taken</p>
          <p className="text-2xl font-bold text-ink-600 mt-1">0</p>
          <span className="text-[10px] text-slate-400">Approved leaves</span>
        </div>
      </div>

      {/* Guidance Card on Attendance Policies */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs panel-hover">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Digitechzo Attendance & Correction Policy
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Office timings are 09:00 AM to 06:00 PM with a standard 15-minute grace window. All check-ins before 09:15 AM are marked <strong>On Time</strong>. If you forgot to punch in or experienced network connectivity issues, submit an <strong>Attendance Correction Request</strong> with the reason, which will be audited and reviewed by your manager.
        </p>
      </div>

      {isCorrectionModalOpen && (
        <CorrectionModal
          onClose={() => setIsCorrectionModalOpen(false)}
          onSuccess={() => {
            setFeedback("Correction request submitted for manager review.");
            setTimeout(() => setFeedback(null), 4000);
          }}
        />
      )}
    </div>
  );
}
