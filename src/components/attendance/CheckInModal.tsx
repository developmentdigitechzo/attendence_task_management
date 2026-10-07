"use client";

import { useState } from "react";
import {
  Building2,
  Home,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";
import { AntdFormItem, AntdInput, AntdButton } from "@/components/ui/AntdUI";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-lg shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)] border border-[#f0f0f0] overflow-hidden max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antd Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <div>
              <h3 className="font-semibold text-base text-slate-800 leading-snug">
                Attendance Punch-In
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your work mode for today
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-[#fff2f0] text-[#cf1322] text-xs rounded border border-[#ffccc7] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="check-in-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Work Type Options */}
            <div>
              <label className="flex items-center gap-1 text-[13px] font-normal text-slate-700 mb-2">
                <span className="text-[#ff4d4f] font-mono">*</span>
                <span>Work Location</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: Office */}
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                    workType === "Office"
                      ? "border-brand-500 bg-brand-50/40 text-brand-700 shadow-xs ring-1 ring-brand-500"
                      : "border-[#d9d9d9] hover:border-brand-300 bg-white text-slate-700"
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
                  <Building2 className={`w-4 h-4 ${workType === "Office" ? "text-brand-600" : "text-slate-400"}`} />
                  <div>
                    <p className="text-xs font-semibold leading-tight">Office</p>
                    <p className="text-[11px] text-slate-400">On-premise</p>
                  </div>
                </label>

                {/* Option 2: Work from Home */}
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                    workType === "Work from Home"
                      ? "border-brand-500 bg-brand-50/40 text-brand-700 shadow-xs ring-1 ring-brand-500"
                      : "border-[#d9d9d9] hover:border-brand-300 bg-white text-slate-700"
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
                  <Home className={`w-4 h-4 ${workType === "Work from Home" ? "text-brand-600" : "text-slate-400"}`} />
                  <div>
                    <p className="text-xs font-semibold leading-tight">Remote (WFH)</p>
                    <p className="text-[11px] text-slate-400">Home office</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notification Notice */}
            {workType === "Work from Home" && (
              <div className="p-3 rounded-md bg-[#e6f4ff] border border-[#91caff] text-[#0958d9] text-xs">
                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">
                      Alerting {recipientLabel}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      An automated notification will be emailed to management recording your remote work status for today.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <AntdFormItem
              label="Punch-In Note"
              help="Optional brief update or task focus for the day"
              className="mb-0"
            >
              <AntdInput
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  workType === "Work from Home"
                    ? "e.g. Working remotely today, reachable on Slack"
                    : "e.g. Desk #4"
                }
                maxLength={150}
              />
            </AntdFormItem>
          </form>
        </div>

        {/* Antd Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[#f0f0f0] bg-slate-50/50 rounded-b-lg">
          <AntdButton type="default" onClick={onClose} disabled={submitting}>
            Cancel
          </AntdButton>
          <AntdButton
            type="primary"
            loading={submitting}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => {
              const form = document.getElementById("check-in-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            Confirm Check In
          </AntdButton>
        </div>
      </div>
    </div>
  );
}
