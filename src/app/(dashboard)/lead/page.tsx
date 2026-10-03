"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  Clock,
  CalendarDays,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Coffee,
  Check,
  X,
  MessageSquare,
  FolderGit2,
  Activity,
  Layers,
} from "lucide-react";
import { formatTimeIST, formatMinutes, getTodayDateString } from "@/lib/utils";

export default function TeamLeadDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamWorkload, setTeamWorkload] = useState<any[]>([]);
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [standupUpdates, setStandupUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLeadData = async () => {
    try {
      const [userRes, workloadRes, tasksRes, corrRes, leaveRes, standupRes] =
        await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/team/workload"),
          fetch("/api/tasks?status=REVIEW"),
          fetch("/api/attendance/corrections?status=PENDING"),
          fetch("/api/leave?status=PENDING"),
          fetch("/api/eod-updates"),
        ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUser(u.user);
      }
      if (workloadRes.ok) {
        const w = await workloadRes.json();
        setTeamWorkload(w.workload || []);
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setReviewTasks(t.tasks || []);
      }
      if (corrRes.ok) {
        const c = await corrRes.json();
        setPendingCorrections(c.corrections || []);
      }
      if (leaveRes.ok) {
        const l = await leaveRes.json();
        setPendingLeaves(l.leaves || []);
      }
      if (standupRes.ok) {
        const s = await standupRes.json();
        setStandupUpdates(s.updates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
    const interval = setInterval(fetchLeadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "COMPLETED" }),
      });
      if (res.ok) {
        setActionMessage("Task approved and marked as Completed! 🎉");
        fetchLeadData();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestChanges = async (taskId: string) => {
    const feedback = prompt("Enter feedback / requested changes:") || "";
    if (!feedback) return;
    try {
      await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content: `[Requested Changes]: ${feedback}` }),
      });
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "IN_PROGRESS" }),
      });
      setActionMessage("Task returned to In Progress with your feedback comments.");
      fetchLeadData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // Team summary counts
  const totalMembers = teamWorkload.length;
  const workingNow = teamWorkload.filter((m) => m.liveState === "WORKING").length;
  const onBreak = teamWorkload.filter((m) => m.liveState === "ON_BREAK").length;
  const totalActiveTasks = teamWorkload.reduce((sum, m) => sum + m.tasks.active, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              Team Lead Command Center
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {getTodayDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome back, {currentUser?.name || "Team Lead"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor team workload balance, approve completed tasks, and track real-time attendance
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/lead/tasks"
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Manage Tasks</span>
          </Link>
          <Link
            href="/lead/projects"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Milestones / Roadmap</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">My Team</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalMembers}</p>
          <span className="text-[10px] text-slate-400">Assigned members</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Working Now</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{workingNow}</p>
          <span className="text-[10px] text-emerald-600 font-medium">{onBreak} on break</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between text-brand-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Active Tasks</span>
            <CheckSquare className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-brand-600 mt-2">{totalActiveTasks}</p>
          <span className="text-[10px] text-slate-400">In sprint execution</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Review Queue</span>
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{reviewTasks.length}</p>
          <span className="text-[10px] text-amber-600 font-medium">Awaiting approval</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between text-ink-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Leave Requests</span>
            <CalendarDays className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-ink-600 mt-2">{pendingLeaves.length}</p>
          <span className="text-[10px] text-ink-600 font-medium">Pending decision</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Missed Punch</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{pendingCorrections.length}</p>
          <span className="text-[10px] text-slate-400">Corrections needed</span>
        </div>
      </div>

      {/* Main Grid: NiftyPM-Style Workload Matrix & Task Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Team Capacity & Workload Balance (NiftyPM) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs panel-hover">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  <span>Team Workload & Capacity Matrix (Nifty-Model)</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Track who is free, who is balanced, and who has too many active deliverables
                </p>
              </div>
              <Link
                href="/lead/team"
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <span>View Full Team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {teamWorkload.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-300 hover:shadow-xs transition bg-white flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Member Avatar, Name & Live Attendance */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{member.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {member.designation} • {member.department}
                          </p>
                        </div>
                      </div>

                      {/* Live Status Badge */}
                      <div>
                        {member.liveState === "WORKING" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Working
                          </span>
                        )}
                        {member.liveState === "ON_BREAK" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Coffee className="w-3 h-3" />
                            Break
                          </span>
                        )}
                        {member.liveState === "ON_LEAVE" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-700 bg-ink-50 border border-ink-200 px-2 py-0.5 rounded-full">
                            Leave
                          </span>
                        )}
                        {member.liveState === "OFFLINE" && (
                          <span className="text-[10px] text-slate-400 font-medium">Offline</span>
                        )}
                      </div>
                    </div>

                    {/* Task Breakdown Chips */}
                    <div className="grid grid-cols-4 gap-1 text-center my-3 py-2 bg-slate-50/80 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Active</p>
                        <p className="font-bold text-slate-800">{member.tasks.active}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-brand-500 uppercase">In Prog</p>
                        <p className="font-bold text-brand-700">{member.tasks.inProgress}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-500 uppercase">Review</p>
                        <p className="font-bold text-amber-700">{member.tasks.inReview}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500 uppercase">Done</p>
                        <p className="font-bold text-emerald-700">{member.tasks.completed}</p>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Workload Capacity:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        member.capacityStatus === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : member.capacityStatus === "BALANCED"
                          ? "bg-brand-50 text-brand-700 border border-brand-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {member.capacityStatus === "AVAILABLE"
                        ? "Available for Tasks"
                        : member.capacityStatus === "BALANCED"
                        ? "Balanced Load"
                        : "High Workload ⚡"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Standups / Team EOD Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs panel-hover">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" />
                  <span>Team Standups & End-of-Day Submissions</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Review what team members completed, what is pending, and any flagged blockers
                </p>
              </div>
              <Link
                href="/lead/standup"
                className="text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                View all standups
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {standupUpdates.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No daily updates submitted yet for today.
                </p>
              ) : (
                standupUpdates.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.user?.name}</span>
                      <span className="text-[10px] text-slate-400">{item.date}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        Completed Today:
                      </span>
                      <p className="text-slate-700 mt-0.5">{item.completedWork}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-brand-700 uppercase">
                        Pending for Tomorrow:
                      </span>
                      <p className="text-slate-700 mt-0.5">{item.pendingWork}</p>
                    </div>

                    {item.blockedWork && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                        <span className="font-bold uppercase text-[10px] block">
                          ⚠️ Roadblock Reported:
                        </span>
                        <span>{item.blockedWork}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 Col): Dedicated Task Review Queue */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs panel-hover">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Task Review Queue</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {reviewTasks.length} pending
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 mb-4">
              Employees submitted these tasks for review. Verify deliverables before approving completion.
            </p>

            <div className="space-y-3">
              {reviewTasks.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  🎉 Review queue is clear! All deliverables processed.
                </div>
              ) : (
                reviewTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2.5 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-slate-700">
                        {t.taskId}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        By {t.assignedTo?.name || "Member"}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 leading-snug">{t.title}</h4>

                    {t.project && (
                      <p className="text-[10px] text-brand-600 font-medium">
                        Project: {t.project.name}
                      </p>
                    )}

                    {/* Action Buttons: Approve or Request Changes */}
                    <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                      <button
                        onClick={() => handleApproveTask(t.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 shadow-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRequestChanges(t.id)}
                        className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        <span>Changes</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-300">
              Team Lead Quick Actions
            </h4>
            <div className="space-y-1.5 text-xs">
              <Link
                href="/lead/attendance"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white"
              >
                <span>Team Live Attendance & Punches</span>
                <span>→</span>
              </Link>
              <Link
                href="/lead/leave"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white"
              >
                <span>Pending Leave Applications</span>
                <span>→</span>
              </Link>
              <Link
                href="/lead/projects"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white"
              >
                <span>Nifty Sprint Milestones</span>
                <span>→</span>
              </Link>
              <Link
                href="/chat"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white"
              >
                <span>Team Chat Channels</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
