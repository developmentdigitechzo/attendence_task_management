"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Calendar,
} from "lucide-react";
import { getTodayDateString, formatDateDisplay } from "@/lib/utils";
import { confirmAction } from "@/components/ui/ConfirmDialog";

export default function EmployeeLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form state
  const [type, setType] = useState("CASUAL");
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Calculate calendar days between two dates
  const calcDays = (s: string, e: string) => {
    if (!s || !e) return 1;
    const d1 = new Date(`${s}T00:00:00Z`);
    const d2 = new Date(`${e}T00:00:00Z`);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const openModal = () => {
    const today = getTodayDateString();
    setStartDate(today);
    setEndDate(today);
    setTotalDays(1);
    setType("CASUAL");
    setReason("");
    setModalError(null);
    setIsApplyModalOpen(true);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    let newEnd = endDate;
    if (val > endDate) {
      newEnd = val;
      setEndDate(val);
    }
    setTotalDays(calcDays(val, newEnd));
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    let newStart = startDate;
    if (val < startDate) {
      newStart = val;
      setStartDate(val);
    }
    setTotalDays(calcDays(newStart, val));
  };

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leave");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setModalError("Please provide a reason for the leave application.");
      return;
    }

    if (startDate > endDate) {
      setModalError("Start date cannot be after end date.");
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          startDate,
          endDate,
          totalDays: Number(totalDays),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to submit leave application.");
      } else {
        setIsApplyModalOpen(false);
        setReason("");
        setMessage("Leave application submitted for manager approval.");
        fetchMyLeaves();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {
      setModalError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    const confirmed = await confirmAction({
      title: "Cancel Leave Request",
      message: "Are you sure you want to withdraw this pending leave application?",
      confirmText: "Withdraw Application",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/leave?id=${leaveId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Leave request cancelled successfully.");
        fetchMyLeaves();
        setTimeout(() => setMessage(null), 4000);
      } else {
        alert(data.error || "Failed to cancel leave.");
      }
    } catch {
      alert("Network error cancelling leave.");
    }
  };

  const approvedDays = leaves
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, l) => sum + (l.totalDays || 1), 0);

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Time Off & Leaves
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave applications and view approval statuses
          </p>
        </div>

        <button
          onClick={openModal}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Leave Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Approved Leaves</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {approvedDays}
          </p>
          <span className="text-[10px] text-slate-400">Total days approved</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Pending Applications</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {pendingCount}
          </p>
          <span className="text-[10px] text-slate-400">Awaiting manager decision</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Rejected Requests</p>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            {rejectedCount}
          </p>
          <span className="text-[10px] text-slate-400">Disapproved applications</span>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Leave History</h2>
          <span className="text-xs text-slate-400 font-medium">{leaves.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Dates</th>
                <th className="py-3 px-4 font-semibold">Total Days</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Reviewer Notes</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading your leave history...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leave requests found. Click "Apply for Leave" above.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-brand-700">
                      <span className="bg-brand-50 border border-brand-100 px-2 py-0.5 rounded text-[11px]">
                        {l.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {formatDateDisplay(l.startDate)} → {formatDateDisplay(l.endDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {l.totalDays} {l.totalDays === 1 ? "day" : "days"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">
                      {l.reviewNotes || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          l.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : l.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status === "PENDING" ? (
                        <button
                          onClick={() => handleCancelLeave(l.id)}
                          title="Withdraw Application"
                          className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Apply for Leave</h3>
                <p className="text-xs text-slate-500">Request formal time off for manager approval</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leave Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 font-semibold text-slate-800"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick / Medical Leave</option>
                  <option value="PERSONAL">Personal Leave</option>
                  <option value="OTHER">Other Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Calculation Preview Pill */}
              <div className="p-3 bg-brand-50/70 border border-brand-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-xs text-brand-900 font-medium">
                    Requested Duration
                  </span>
                </div>
                <span className="text-xs font-bold text-brand-700 bg-white px-2 py-0.5 rounded-lg border border-brand-200">
                  {totalDays} {totalDays === 1 ? "day" : "days"}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Total Working Days
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Auto-calculated from date range
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={totalDays}
                  onChange={(e) => setTotalDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Leave *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting time off..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
