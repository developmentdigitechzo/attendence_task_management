"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  MessageSquare,
  CalendarDays,
  Bell,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Flame,
} from "lucide-react";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import EODUpdateModal from "@/components/dashboard/EODUpdateModal";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { formatDateDisplay } from "@/lib/utils";

export default function EmployeeDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [eodSubmitted, setEodSubmitted] = useState(false);
  const [isEODModalOpen, setIsEODModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async () => {
    try {
      const [userRes, tasksRes, annRes, eodRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/tasks?filter=my"),
        fetch("/api/announcements"),
        fetch("/api/eod-updates"),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(t.tasks || []);
      }
      if (annRes.ok) {
        const a = await annRes.json();
        setAnnouncements(a.announcements?.slice(0, 3) || []);
      }
      if (eodRes.ok) {
        const e = await eodRes.json();
        setEodSubmitted(Boolean(e.updates && e.updates.length > 0));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const topPriorities = pendingTasks.slice(0, 3);
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-6 pb-12">
      {/* Attendance & Time Engine (Large, Touch-friendly) */}
      <AttendanceWidget
        userName={user?.name || "Team Member"}
        onStatusChange={fetchEmployeeData}
      />

      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/employee/tasks"
          className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-brand-400 hover:shadow-sm transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">My Tasks</p>
            <p className="text-[11px] text-slate-500">{pendingTasks.length} pending</p>
          </div>
        </Link>

        <Link
          href="/chat"
          className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-brand-400 hover:shadow-sm transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Internal Chat</p>
            <p className="text-[11px] text-slate-500">Channels & DMs</p>
          </div>
        </Link>

        <Link
          href="/employee/leave"
          className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-brand-400 hover:shadow-sm transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Apply Leave</p>
            <p className="text-[11px] text-slate-500">Submit requests</p>
          </div>
        </Link>

        <button
          onClick={() => setIsEODModalOpen(true)}
          className={`p-4 rounded-xl border text-left transition flex items-center gap-3 ${
            eodSubmitted
              ? "bg-emerald-50/70 border-emerald-200"
              : "bg-brand-600 text-white border-transparent hover:bg-brand-700 shadow-md shadow-brand-600/20"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              eodSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-white/20 text-white"
            }`}
          >
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-xs font-bold ${eodSubmitted ? "text-emerald-900" : "text-white"}`}>
              {eodSubmitted ? "EOD Submitted" : "Daily EOD Update"}
            </p>
            <p className={`text-[11px] ${eodSubmitted ? "text-emerald-700" : "text-brand-100"}`}>
              {eodSubmitted ? "Update recorded" : "Complete & Pending"}
            </p>
          </div>
        </button>
      </div>

      {/* Main Focus: Today's Priorities & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Priority Tasks (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs panel-hover">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Today's Top Priorities (Focus Mode)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Execute these critical tasks first</p>
              </div>
              <Link
                href="/employee/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <span>View All Tasks ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {topPriorities.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  🎉 No pending tasks! You are all caught up for today.
                </div>
              ) : (
                topPriorities.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-4 bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.taskId}
                        </span>
                        {task.project && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {task.project.name}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === "URGENT"
                              ? "bg-rose-100 text-rose-700"
                              : task.priority === "HIGH"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{task.title}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.status === "IN_PROGRESS"
                            ? "bg-brand-50 text-brand-700 border border-brand-200"
                            : task.status === "REVIEW"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : task.status === "BLOCKED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      {task.dueDate && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Due: {formatDateDisplay(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Announcements & Daily Tip */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs panel-hover">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-brand-500" />
                <span>Announcements</span>
              </h3>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No active company announcements.</p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-xl border text-xs ${
                      a.priority === "IMPORTANT" || a.priority === "URGENT"
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-900">{a.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{a.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Work Policy Card */}
          <div className="bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-300">
              Digitechzo Working Code
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-brand-400">✓</span>
                <span>Check in before 09:15 AM to maintain full attendance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-400">✓</span>
                <span>Pause with "Start Break" when taking tea or lunch.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-400">✓</span>
                <span>Submit your quick 1-minute End-of-Day update before 6 PM.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUserId={user?.id}
          userRole={user?.role}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchEmployeeData();
            setSelectedTask(null);
          }}
        />
      )}

      {/* End of Day Modal */}
      {isEODModalOpen && (
        <EODUpdateModal
          onClose={() => setIsEODModalOpen(false)}
          onSuccess={() => {
            setEodSubmitted(true);
            fetchEmployeeData();
          }}
        />
      )}
    </div>
  );
}
