"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  AlertTriangle,
  Send,
  Calendar,
  User,
  Building,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [audience, setAudience] = useState("EVERYONE");
  const [departmentId, setDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async (deptId?: string) => {
    setLoading(true);
    try {
      const filter = deptId !== undefined ? deptId : selectedDeptFilter;
      const url = filter && filter !== "ALL" ? `/api/announcements?departmentId=${filter}` : "/api/announcements";
      const [annRes, deptRes] = await Promise.all([
        fetch(url),
        fetch("/api/departments"),
      ]);
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
      if (deptRes.ok) {
        const dData = await deptRes.json();
        setDepartments(dData.departments || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDeptFilterChange = (deptId: string) => {
    setSelectedDeptFilter(deptId);
    fetchAnnouncements(deptId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (audience === "DEPARTMENT" && (!departmentId || departmentId.trim() === "")) {
      setError("Please select a target department for this announcement.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          priority,
          audience,
          departmentId: audience === "DEPARTMENT" ? departmentId : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setTitle("");
        setContent("");
        setPriority("NORMAL");
        setAudience("EVERYONE");
        setDepartmentId("");
        setError(null);
        setMessage(
          audience === "DEPARTMENT"
            ? "Announcement sent successfully to the selected department."
            : "Announcement broadcasted successfully to all staff."
        );
        fetchAnnouncements();
        setTimeout(() => setMessage(null), 4000);
      } else {
        setError(data.error || "Failed to post announcement.");
      }
    } catch {
      setError("An unexpected error occurred while posting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Company Notice Board & Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast official notices, schedule changes, and company policies
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => handleDeptFilterChange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 text-xs font-medium rounded-xl shadow-xs text-slate-700 outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setError(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Announcements Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No active announcements found. Click "Post Announcement" to broadcast to the team.
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

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.createdBy?.name}</span>
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
                      {item.department.name} Department Only
                    </span>
                  ) : (
                    <strong className="text-slate-700">All Company Staff</strong>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 ease-out">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Post Announcement</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Office schedule change for Friday"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Type the full announcement message..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent ⚡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => {
                      setAudience(e.target.value);
                      if (e.target.value !== "DEPARTMENT") {
                        setDepartmentId("");
                      }
                      if (error) setError(null);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="EVERYONE">Everyone</option>
                    <option value="DEPARTMENT">Specific Department</option>
                  </select>
                </div>
              </div>

              {audience === "DEPARTMENT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Target Department *
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                  >
                    <option value="">Choose department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Only active employees in this selected department will receive and see this announcement.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 interactive-tap"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Broadcast Notice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
