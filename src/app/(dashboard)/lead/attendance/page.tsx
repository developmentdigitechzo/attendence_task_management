"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Coffee,
  Check,
  X,
  AlertCircle,
  Calendar,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { formatTimeIST, formatMinutes, getTodayDateString, formatDateDisplay } from "@/lib/utils";

export default function LeadAttendancePage() {
  const [workload, setWorkload] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"LIVE" | "CORRECTIONS">("LIVE");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const [wRes, cRes] = await Promise.all([
        fetch("/api/team/workload"),
        fetch("/api/attendance/corrections"),
      ]);

      if (wRes.ok) {
        const wData = await wRes.json();
        setWorkload(wData.workload || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCorrections(cData.corrections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    const interval = setInterval(fetchAttendanceData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleReviewCorrection = async (
    correctionId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    const reviewNotes =
      prompt(`Enter remark for ${action.toLowerCase()}ing:`) || "";
    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctionId, action, reviewNotes }),
      });

      if (res.ok) {
        setFeedback(`Correction request ${action.toLowerCase()}d successfully.`);
        fetchAttendanceData();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCorrections = corrections.filter((c) => c.status === "PENDING");
  const workingCount = workload.filter((m) => m.liveState === "WORKING").length;
  const breakCount = workload.filter((m) => m.liveState === "ON_BREAK").length;
  const leaveCount = workload.filter((m) => m.liveState === "ON_LEAVE").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              Automated Attendance System
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {getTodayDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Team Live Attendance & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time team presence, active timers, and review missed check-in correction requests
          </p>
        </div>

        {/* Live Attendance Counters */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{workingCount} Working</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-1.5 text-xs text-amber-700 font-bold">
            <Coffee className="w-3.5 h-3.5" />
            <span>{breakCount} Break</span>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5 text-xs text-blue-700 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{leaveCount} Leave</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("LIVE")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "LIVE"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Live Team Roster ({workload.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("CORRECTIONS")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "CORRECTIONS"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Missed Punch Corrections</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === "CORRECTIONS"
                ? "bg-amber-700 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {pendingCorrections.length}
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE ATTENDANCE ROSTER */}
      {activeTab === "LIVE" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Live State</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Active Duration</th>
                <th className="py-3 px-4">Capacity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading attendance...
                  </td>
                </tr>
              ) : workload.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active team members found.
                  </td>
                </tr>
              ) : (
                workload.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {m.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {m.employeeId} • {m.designation}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {m.department}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.liveState === "WORKING"
                            ? "bg-emerald-100 text-emerald-800"
                            : m.liveState === "ON_BREAK"
                            ? "bg-amber-100 text-amber-800"
                            : m.liveState === "ON_LEAVE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            m.liveState === "WORKING"
                              ? "bg-emerald-500"
                              : m.liveState === "ON_BREAK"
                              ? "bg-amber-500"
                              : m.liveState === "ON_LEAVE"
                              ? "bg-blue-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {m.liveState}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      {m.checkInTime ? formatTimeIST(m.checkInTime) : "--:--"}
                    </td>

                    <td className="py-3 px-4 font-semibold text-brand-600">
                      {m.workDurationMinutes > 0
                        ? formatMinutes(m.workDurationMinutes)
                        : "--"}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.capacityStatus === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : m.capacityStatus === "BALANCED"
                            ? "bg-brand-50 text-brand-700 border border-brand-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {m.capacityStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE CORRECTIONS QUEUE */}
      {activeTab === "CORRECTIONS" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-950">
                  {pendingCorrections.length} Missed Punch Correction Request(s)
                </h3>
                <p className="text-xs text-amber-800">
                  Review time correction requests submitted by team members when network issues or missed checkouts happen.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Requested Check-In</th>
                  <th className="py-3 px-4">Requested Check-Out</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No correction requests submitted.
                    </td>
                  </tr>
                ) : (
                  corrections.map((corr) => (
                    <tr key={corr.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{corr.user.name}</span>
                        <span className="block text-[10px] text-slate-400">
                          {corr.user.employeeId}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {formatDateDisplay(corr.requestedDate)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {corr.requestedCheckIn ? formatTimeIST(corr.requestedCheckIn) : "--"}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {corr.requestedCheckOut ? formatTimeIST(corr.requestedCheckOut) : "--"}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {corr.reason}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            corr.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : corr.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {corr.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {corr.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewCorrection(corr.id, "APPROVE")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReviewCorrection(corr.id, "REJECT")}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
