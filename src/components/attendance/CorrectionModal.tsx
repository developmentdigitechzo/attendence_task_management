"use client";

import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { getTodayDateString, formatTime12h } from "@/lib/utils";
import { AntdFormItem, AntdInput, AntdTextarea, AntdButton } from "@/components/ui/AntdUI";

export default function CorrectionModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [requestedDate, setRequestedDate] = useState(getTodayDateString());
  const [requestedCheckIn, setRequestedCheckIn] = useState("10:00");
  const [requestedCheckOut, setRequestedCheckOut] = useState("19:00");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a valid reason for the correction request.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedDate,
          requestedCheckIn,
          requestedCheckOut,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-md w-full shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)] border border-[#f0f0f0] animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] flex flex-col">
        {/* Antd Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <div>
            <h3 className="font-semibold text-base text-slate-800 leading-snug">Attendance Correction</h3>
            <p className="text-xs text-slate-400 mt-0.5">Submit missed check-in/out for manager approval</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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

          <form id="correction-form" onSubmit={handleSubmit} className="space-y-1">
            <AntdFormItem label="Date" required>
              <AntdInput
                type="date"
                required
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </AntdFormItem>

            <div className="grid grid-cols-2 gap-x-4">
              <AntdFormItem
                label="Check-In"
                help={formatTime12h(requestedCheckIn)}
              >
                <AntdInput
                  type="time"
                  value={requestedCheckIn}
                  onChange={(e) => setRequestedCheckIn(e.target.value)}
                />
              </AntdFormItem>

              <AntdFormItem
                label="Check-Out"
                help={formatTime12h(requestedCheckOut)}
              >
                <AntdInput
                  type="time"
                  value={requestedCheckOut}
                  onChange={(e) => setRequestedCheckOut(e.target.value)}
                />
              </AntdFormItem>
            </div>

            <AntdFormItem label="Reason for Correction" required>
              <AntdTextarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Internet outage at 9 AM, arrived on time or forgot to punch out."
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
            icon={<Send className="w-3.5 h-3.5" />}
            onClick={() => {
              const form = document.getElementById("correction-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            Submit Request
          </AntdButton>
        </div>
      </div>
    </div>
  );
}
