"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, User, Building } from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export default function EmployeeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Company Notices & Announcements
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Important updates, company schedules, and leadership notifications
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No active announcements.
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs transition ${
                item.priority === "URGENT"
                  ? "border-rose-300 ring-1 ring-rose-100"
                  : item.priority === "IMPORTANT"
                  ? "border-amber-300 ring-1 ring-amber-100"
                  : "border-slate-200/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority === "URGENT"
                        ? "bg-rose-100 text-rose-800"
                        : item.priority === "IMPORTANT"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {item.priority}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">
                    {item.createdBy?.name}
                  </span>
                  <span>•</span>
                  <span>{formatDateDisplay(item.createdAt)}</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {item.content}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  Audience:{" "}
                  {item.audience === "DEPARTMENT" && item.department?.name ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                      <Building className="w-3 h-3 text-indigo-500" />
                      {item.department.name} Department
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">All Company Staff</span>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
