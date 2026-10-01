"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Check,
  X,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export default function LeadLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/leave?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleReviewLeave = async (
    leaveId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    const reviewNotes =
      prompt(`Enter remark for ${action.toLowerCase()}ing:`) || "";
    try {
      const res = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, action, reviewNotes }),
      });

      if (res.ok) {
        setFeedback(`Leave request ${action.toLowerCase()}d successfully.`);
        fetchLeaves();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              Leave Administration
            </span>
            <span className="text-xs text-slate-400 font-medium">Team Time-Off</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Team Leave Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review employee time-off requests, sick leave applications, and plan team schedule capacity
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none shadow-xs font-medium"
          >
            <option value="ALL">All Requests ({leaves.length})</option>
            <option value="PENDING">Pending Only ({pendingCount})</option>
            <option value="APPROVED">Approved ({approvedCount})</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between card-hover">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between card-hover">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Approved Leaves</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between card-hover">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Applications</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{leaves.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-600" />
            <span>Leave Requests Record</span>
          </h2>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Days</th>
              <th className="py-3 px-4">Reason / Purpose</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Loading leave records...
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No leave requests match the selected status filter.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {leave.user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{leave.user.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {leave.user.employeeId} • {leave.user.department?.name || "General"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {leave.type}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatDateDisplay(leave.startDate)} → {formatDateDisplay(leave.endDate)}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                  </td>

                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    <p className="truncate">{leave.reason}</p>
                    {leave.reviewNotes && (
                      <p className="text-[10px] text-brand-600 italic mt-0.5 truncate">
                        Note: {leave.reviewNotes}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : leave.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {leave.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReviewLeave(leave.id, "APPROVE")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReviewLeave(leave.id, "REJECT")}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
