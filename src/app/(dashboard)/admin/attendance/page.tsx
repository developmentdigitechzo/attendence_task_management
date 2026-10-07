"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileBarChart2,
  Calendar,
  AlertCircle,
  Coffee,
  Check,
  X,
  Download,
} from "lucide-react";
import { formatTimeIST, formatMinutes, getTodayDateString, formatTime12h } from "@/lib/utils";
import { promptAction } from "@/components/ui/ConfirmDialog";

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departments, setDepartments] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("date", selectedDate);
      if (departmentFilter !== "ALL") params.set("departmentId", departmentFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [attRes, corrRes] = await Promise.all([
        fetch(`/api/attendance/overview?${params.toString()}`),
        fetch(`/api/attendance/corrections`),
      ]);

      if (attRes.ok) setOverview(await attRes.json());
      if (corrRes.ok) {
        const cData = await corrRes.json();
        setCorrections(cData.corrections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, departmentFilter, statusFilter]);

  const handleReviewCorrection = async (
    correctionId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    const isApprove = action === "APPROVE";
    const notes = await promptAction({
      title: isApprove ? "Approve Attendance Correction" : "Reject Attendance Correction",
      message: `Are you sure you want to ${isApprove ? "approve" : "reject"} this attendance correction request?`,
      confirmText: isApprove ? "Approve" : "Reject",
      variant: isApprove ? "default" : "danger",
      noteLabel: "Review Note (optional)",
      notePlaceholder: isApprove ? "Add an approval remark..." : "Reason for rejection...",
    });
    if (notes === null) return;

    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctionId,
          action,
          reviewNotes: notes,
        }),
      });

      if (res.ok) {
        setActionMessage(`Correction request ${action.toLowerCase()}d.`);
        fetchAttendance();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCorrections = corrections.filter((c) => c.status === "PENDING");
  const stats = overview?.stats || {
    totalEmployees: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    currentlyWorking: 0,
    notCheckedIn: 0,
  };

  const getRosterExportUrl = (format: "csv" | "excel") => {
    const params = new URLSearchParams();
    params.set("type", "roster");
    params.set("format", format);
    params.set("date", selectedDate);
    if (departmentFilter && departmentFilter !== "ALL") {
      params.set("departmentId", departmentFilter);
    }
    if (statusFilter && statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }
    return `/api/reports/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Operations & Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric/web check-in timestamps, working durations & correction queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getRosterExportUrl("csv")}
            download
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <a
            href={getRosterExportUrl("excel")}
            download
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </a>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Date & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 card-hover">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-brand-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setSelectedDate(getTodayDateString())}
            className="px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-xl transition"
          >
            Jump to Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late Arrivals</option>
            <option value="WORKING">Currently Working</option>
            <option value="ON_BREAK">On Break</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="OFFLINE">Not Checked In</option>
          </select>
        </div>
      </div>

      {/* Metric Counters for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Present</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.present}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Currently Working</p>
          <p className="text-xl font-bold text-brand-600 mt-1">{stats.currentlyWorking}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Late Arrivals</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{stats.late}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">On Leave</p>
          <p className="text-xl font-bold text-ink-600 mt-1">{stats.onLeave}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Not Checked In</p>
          <p className="text-xl font-bold text-slate-600 mt-1">{stats.notCheckedIn}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Turnout Rate</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats.totalEmployees > 0 ? Math.round((stats.present / stats.totalEmployees) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Attendance Log for {selectedDate}
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {overview?.records?.length || 0} employees listed
          </span>
        </div>

        <div className="overflow-x-auto pb-1">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold">Check In</th>
                <th className="py-3.5 px-4 font-semibold">Check Out</th>
                <th className="py-3.5 px-4 font-semibold">Work Hours</th>
                <th className="py-3.5 px-4 font-semibold">Break Hours</th>
                <th className="py-3.5 px-4 font-semibold">Recorded Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Live State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={`att-skel-${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 skeleton-shimmer shrink-0" />
                        <div className="space-y-1.5 min-w-0">
                          <div className="w-24 h-3 bg-slate-200 rounded skeleton-shimmer" />
                          <div className="w-16 h-2 bg-slate-100 rounded skeleton-shimmer" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-12 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-12 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded-full skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-16 h-4 bg-slate-200 rounded-full ml-auto skeleton-shimmer" /></td>
                  </tr>
                ))
              ) : overview?.records?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No attendance records for this date and filter.
                  </td>
                </tr>
              ) : (
                overview?.records?.map((rec: any) => (
                  <tr key={rec.userId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {rec.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{rec.name}</p>
                          <p className="text-[10px] text-slate-400">{rec.employeeId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {rec.department}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {formatTimeIST(rec.checkIn)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {formatTimeIST(rec.checkOut)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {formatMinutes(rec.workDurationMinutes)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {formatMinutes(rec.breakDurationMinutes)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rec.status === "LATE"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : rec.status === "ON_LEAVE"
                            ? "bg-ink-50 text-ink-700 border border-ink-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {rec.liveState === "WORKING" && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Working
                        </span>
                      )}
                      {rec.liveState === "ON_BREAK" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Coffee className="w-3 h-3" />
                          Break
                        </span>
                      )}
                      {rec.liveState === "ON_LEAVE" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-700 bg-ink-50 border border-ink-200 px-2 py-0.5 rounded-full">
                          Leave
                        </span>
                      )}
                      {rec.liveState === "OFFLINE" && (
                        <span className="text-[10px] text-slate-400 font-medium">Offline</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Requests Workflow Section (Section 10) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 panel-hover">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Attendance Correction Requests Queue</span>
              {pendingCorrections.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {pendingCorrections.length} pending
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Audit and approve missed check-in/out claims from employees
            </p>
          </div>
        </div>

        {corrections.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No correction requests submitted.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Target Date</th>
                  <th className="pb-3 font-semibold">Claimed Times</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.map((corr) => (
                  <tr key={corr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 font-semibold text-slate-900">
                      {corr.user.name} ({corr.user.employeeId})
                    </td>
                    <td className="py-3 font-mono text-slate-700">{corr.requestedDate}</td>
                    <td className="py-3 font-mono text-slate-600">
                      In: {formatTime12h(corr.requestedCheckIn)} | Out: {formatTime12h(corr.requestedCheckOut)}
                    </td>
                    <td className="py-3 text-slate-600 max-w-xs truncate" title={corr.reason}>
                      {corr.reason}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          corr.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : corr.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {corr.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {corr.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReviewCorrection(corr.id, "APPROVE")}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReviewCorrection(corr.id, "REJECT")}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
