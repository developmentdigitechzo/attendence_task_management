"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Clock,
  ShieldAlert,
  X,
  RefreshCw,
  Database,
  Calendar,
} from "lucide-react";
import { toast } from "@/components/ui/ToastProvider";
import { isMonthlyBackupDay } from "@/lib/chatRetentionConstants";

const SIMULATE_DAY30_EVENT = "app:simulate-chat-backup-day30";

function getMonthKey() {
  const d = new Date();
  return `chat_backup_dismissed_${d.getFullYear()}_${d.getMonth() + 1}`;
}

export async function downloadChatBackup(): Promise<void> {
  const res = await fetch("/api/chat/backup");
  if (!res.ok) throw new Error("Failed to export chat backup");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `chat_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Top header controls for chat: Backup button + Test Day 30 Toast button.
 */
export function MonthlyBackupHeaderActions() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadChatBackup();
      toast.success("Chat backup downloaded successfully! (JSON archive)");
    } catch (e: any) {
      toast.error(e?.message || "Failed to download chat backup.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSimulate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SIMULATE_DAY30_EVENT));
    }
    toast.notification(
      "Today is the 30th! Reminder: Internal chat messages older than 100 days are automatically erased. Please backup your chat now.",
      {
        title: "Monthly Chat Backup Reminder (Day 30)",
        duration: 10000,
      }
    );
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 rounded-xl text-xs font-semibold transition"
        title="Backup & export complete chat history as JSON before the 100-day cutoff"
      >
        {isDownloading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
        ) : (
          <Download className="w-3.5 h-3.5 text-slate-500 hover:text-brand-600" />
        )}
        <span className="hidden sm:inline">Backup Chat</span>
      </button>

      <button
        type="button"
        onClick={handleSimulate}
        className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-medium transition"
        title="Simulate 30th day monthly backup reminder toast and alert banner"
      >
        <Calendar className="w-3 h-3 text-amber-600" />
        <span className="hidden md:inline">Test Day 30 Toast</span>
      </button>
    </div>
  );
}

/**
 * Prominent Day 30 Alert Banner that renders atop the message feed.
 * Automatically appears on the 30th day of the month or when simulated.
 */
export default function MonthlyBackupReminder() {
  const [isBackupDay, setIsBackupDay] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [retentionDays, setRetentionDays] = useState(100);

  useEffect(() => {
    // 1. Check local date & API
    const isToday30th = isMonthlyBackupDay(new Date());
    setIsBackupDay(isToday30th);

    const dismissedKey = getMonthKey();
    const alreadyDismissed = localStorage.getItem(dismissedKey) === "true";

    if (isToday30th && !alreadyDismissed) {
      setIsDismissed(false);
      // Fire the global toast on the 30th day of the month
      toast.notification(
        "Today is the 30th! Reminder: Internal chat messages older than 100 days are automatically erased. Please backup your chat now.",
        {
          title: "Monthly Chat Backup Reminder (Day 30)",
          duration: 10000,
        }
      );
    }

    // 2. Query status from backend
    fetch("/api/chat/cleanup")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.retentionDays) setRetentionDays(data.retentionDays);
          if (data.isBackupDay && !alreadyDismissed) {
            setIsBackupDay(true);
            setIsDismissed(false);
          }
        }
      })
      .catch(() => {});

    // 3. Listen for manual simulation event
    const onSimulate = () => {
      setIsSimulated(true);
      setIsDismissed(false);
    };

    window.addEventListener(SIMULATE_DAY30_EVENT, onSimulate);
    return () => window.removeEventListener(SIMULATE_DAY30_EVENT, onSimulate);
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadChatBackup();
      toast.success("Chat backup downloaded successfully! Keep this JSON file in a safe location.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to download chat backup.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsSimulated(false);
    localStorage.setItem(getMonthKey(), "true");
    toast.info("Monthly backup reminder dismissed for this month.");
  };

  const showBanner = (!isDismissed && isBackupDay) || isSimulated;

  if (!showBanner) {
    return (
      <div className="px-4 py-1.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-slate-400" />
          <span>
            <strong>100-Day Auto Retention:</strong> Messages older than 100 days are automatically erased.
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className="hidden sm:inline">Backup toast alerts generate on the 30th day of every month.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white shadow-md border-b border-amber-400/40 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-xs mt-0.5">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                Monthly Chat Backup Reminder (Day 30)
              </span>
              <span className="text-[10px] font-bold bg-white text-rose-700 px-2 py-0.2 rounded-full uppercase tracking-wider shadow-2xs">
                100-Day Retention Notice
              </span>
              {isSimulated && (
                <span className="text-[10px] font-mono bg-amber-950/40 text-amber-200 px-1.5 py-0.2 rounded border border-white/20">
                  Day 30 Test Active
                </span>
              )}
            </div>
            <p className="text-xs text-white/90 mt-0.5 leading-snug">
              Today is the <strong>30th day</strong> of the month. Internal chat messages older than{" "}
              <strong>{retentionDays} days</strong> are automatically erased.
              Please backup your chat history now to prevent data loss.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-700 hover:bg-amber-50 active:scale-95 font-bold text-xs rounded-xl shadow-xs transition"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Backing up...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Backup Chat (.json)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Dismiss for this month"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
