"use client";

import { useState } from "react";
import {
  Building2,
  Home,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  userRole?: string;
}

export default function CheckInModal({
  isOpen,
  onClose,
  onSuccess,
  userRole,
}: CheckInModalProps) {
  const [workType, setWorkType] = useState<"Office" | "Work from Home">("Office");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workType,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to check in.");
      } else {
        onSuccess(data);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const recipientLabel =
    userRole === "MANAGER" ? "Managing Director / Admin" : "Team Lead";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-white/90 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Daily Attendance Punch-In</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white">
            Select Your Work Type
          </h3>
          <p className="text-xs text-brand-100 mt-1">
            Specify whether you are working from the office or remotely today before punching in.
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Work Type Radio Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Work Type <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Office */}
              <label
                className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                  workType === "Office"
                    ? "border-brand-600 bg-brand-50/50 shadow-sm shadow-brand-500/10"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="workType"
                  value="Office"
                  checked={workType === "Office"}
                  onChange={() => setWorkType("Office")}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    workType === "Office"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight">Office</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">On-premise desk</p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      workType === "Office"
                        ? "border-brand-600 bg-brand-600"
                        : "border-slate-300"
                    }`}
                  >
                    {workType === "Office" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </label>

              {/* Option 2: Work from Home */}
              <label
                className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                  workType === "Work from Home"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-500/10"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="workType"
                  value="Work from Home"
                  checked={workType === "Work from Home"}
                  onChange={() => setWorkType("Work from Home")}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    workType === "Work from Home"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Home className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    Work from Home
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Remote workday</p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      workType === "Work from Home"
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-slate-300"
                    }`}
                  >
                    {workType === "Work from Home" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Special Email Dispatch Notice when Work From Home is selected */}
          {workType === "Work from Home" && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-900">
                    Email Notification to Team Lead ({recipientLabel})
                  </p>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    Selecting <strong>Work from Home</strong> will automatically send an email alert to{" "}
                    <strong className="text-amber-950 font-semibold underline">manimehalaidigitechzo@gmail.com</strong> informing them of your remote status today.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Optional Notes input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason / Note {workType === "Work from Home" ? "(optional for Lead)" : "(optional)"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                workType === "Work from Home"
                  ? "e.g., Working remotely today, reachable on Slack & phone"
                  : "e.g., Working from 2nd floor lab"
              }
              maxLength={150}
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-md shadow-brand-600/25 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Punching In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Confirm Check In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
