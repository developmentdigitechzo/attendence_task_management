"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { getTodayDateString, formatDateDisplay } from "@/lib/utils";

export default function LeadStandupPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/eod-updates?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandups();
  }, [selectedDate]);

  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const blockedCount = updates.filter(
    (u) => u.blockedWork && u.blockedWork.trim().length > 0
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              Asynchronous Standups
            </span>
            <span className="text-xs text-slate-400 font-medium">Daily EOD Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Team Daily Standups & EOD Updates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-of-day progress reflections, sprint hurdles, and blocker resolution feed
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs self-start sm:self-auto panel-hover">
          <button
            onClick={() => changeDateBy(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent outline-none px-2 cursor-pointer"
          />

          <button
            onClick={() => changeDateBy(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(getTodayDateString())}
            className="px-2.5 py-1 text-[11px] font-bold bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Blocker Alert Banner */}
      {blockedCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-rose-950">
              {blockedCount} Team Member(s) Reported Blockers for {formatDateDisplay(selectedDate)}
            </h4>
            <p className="text-[11px] text-rose-800 mt-0.5">
              Review flagged items below to provide code reviews, assets, or unblock dependencies.
            </p>
          </div>
        </div>
      )}

      {/* Standup Submissions List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading daily standups...</div>
      ) : updates.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No Standups Recorded for this Date</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Team members submit their End-of-Day reflection before signing out. Check back around evening hours or select a previous date.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-brand-300 transition"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-bold flex items-center justify-center text-xs shadow">
                    {update.user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{update.user.name}</h3>
                    <p className="text-[10px] text-slate-400">
                      {update.user.employeeId} • {update.user.designation || update.user.department?.name}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {formatDateDisplay(update.date)}
                </span>
              </div>

              {/* Three Pillars: Completed, Pending, Blockers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                {/* Completed */}
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed Today</span>
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {update.completedWork}
                  </p>
                </div>

                {/* Planned for Tomorrow */}
                <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-100/80">
                  <p className="font-bold text-brand-800 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    <span>Planned Next</span>
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {update.pendingWork}
                  </p>
                </div>

                {/* Blockers */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    update.blockedWork
                      ? "bg-rose-50/80 border-rose-200"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <p
                    className={`font-bold flex items-center gap-1.5 mb-2 ${
                      update.blockedWork ? "text-rose-800" : "text-slate-500"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        update.blockedWork ? "text-rose-600" : "text-slate-400"
                      }`}
                    />
                    <span>Blockers / Help Needed</span>
                  </p>
                  <p
                    className={`whitespace-pre-wrap leading-relaxed ${
                      update.blockedWork ? "text-rose-900 font-medium" : "text-slate-400 italic"
                    }`}
                  >
                    {update.blockedWork || "None reported. Smooth progress."}
                  </p>
                </div>
              </div>

              {/* Extra Notes if any */}
              {update.notes && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Remarks: </span>
                  <span>{update.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
