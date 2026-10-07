"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  Clock,
  Flame,
  AlertTriangle,
  Plus,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { formatTimeIST, formatMinutes } from "@/lib/utils";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

export default function LeadTeamWorkloadPage() {
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCapacity, setFilterCapacity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [preselectedAssignee, setPreselectedAssignee] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team/workload");
      if (res.ok) {
        const data = await res.json();
        setWorkload(data.workload || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
    const interval = setInterval(fetchWorkload, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAssign = (userId: string) => {
    setPreselectedAssignee(userId);
    setIsCreateTaskOpen(true);
  };

  // Filter members
  const filteredMembers = workload.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCapacity =
      filterCapacity === "ALL" || m.capacityStatus === filterCapacity;
    return matchesSearch && matchesCapacity;
  });

  // Metrics
  const totalMembers = workload.length;
  const availableMembers = workload.filter((m) => m.capacityStatus === "AVAILABLE").length;
  const balancedMembers = workload.filter((m) => m.capacityStatus === "BALANCED").length;
  const overloadedMembers = workload.filter((m) => m.capacityStatus === "OVERLOADED").length;
  const workingNow = workload.filter((m) => m.liveState === "WORKING").length;
  const onBreak = workload.filter((m) => m.liveState === "ON_BREAK").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              Nifty-Style Workload Matrix
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Capacity & Resource Balance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Team Workload & Capacity Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance task distribution, prevent burnout, and manage team member capacity in real-time
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedAssignee("");
            setIsCreateTaskOpen(true);
          }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Delegate New Task</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Capacity & Live Presence Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Live Active Squad</p>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {workingNow} <span className="text-xs font-normal text-slate-400">/ {totalMembers} online</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {onBreak > 0 ? `${onBreak} currently on break` : "All checked-in members active"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700">Available Capacity</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Low Load
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{availableMembers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Ready for upcoming sprint tasks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-brand-700">Balanced Capacity</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Healthy
            </span>
          </div>
          <p className="text-2xl font-bold text-brand-600 mt-1">{balancedMembers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Optimal workload range (3-4 tasks)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-700">Overloaded Members</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Attention
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-1">{overloadedMembers}</p>
          <p className="text-[11px] text-slate-500 mt-1">5+ active tasks; consider reallocating</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 card-hover">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by member name, role, department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Capacity:</span>
          <div className="flex flex-wrap items-center gap-1">
            {["ALL", "AVAILABLE", "BALANCED", "OVERLOADED"].map((cap) => (
              <button
                key={cap}
                onClick={() => setFilterCapacity(cap)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterCapacity === cap
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cap === "ALL" ? "All Members" : cap}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading team workload matrix...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No team members match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm hover:border-brand-300 transition flex flex-col justify-between"
            >
              {/* Card Top: Member info & live badge */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-bold flex items-center justify-center text-sm shadow">
                        {member.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                          member.liveState === "WORKING"
                            ? "bg-emerald-500"
                            : member.liveState === "ON_BREAK"
                            ? "bg-amber-400"
                            : member.liveState === "ON_LEAVE"
                            ? "bg-blue-400"
                            : "bg-slate-300"
                        }`}
                        title={member.liveState}
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{member.name}</h3>
                      <p className="text-[11px] text-slate-500">{member.designation}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-400">
                        {member.department} • {member.employeeId}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Indicator Pill */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      member.capacityStatus === "AVAILABLE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : member.capacityStatus === "BALANCED"
                        ? "bg-brand-50 text-brand-700 border-brand-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {member.capacityStatus}
                  </span>
                </div>

                {/* Today's Attendance Snapshot */}
                <div className="mt-4 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {member.checkInTime
                        ? `Punched In ${formatTimeIST(member.checkInTime)}`
                        : member.liveState === "ON_LEAVE"
                        ? "On Approved Leave"
                        : "Not Checked In Today"}
                    </span>
                  </div>
                  {member.workDurationMinutes > 0 && (
                    <span className="font-semibold text-brand-600">
                      {formatMinutes(member.workDurationMinutes)} logged
                    </span>
                  )}
                </div>

                {/* Task Breakdown Counts */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Active</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {member.tasks.active}
                    </p>
                  </div>
                  <div className="p-2 bg-brand-50/60 rounded-lg">
                    <p className="text-[10px] text-brand-600 uppercase font-semibold">In Dev</p>
                    <p className="text-base font-bold text-brand-700 mt-0.5">
                      {member.tasks.inProgress}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-50/60 rounded-lg">
                    <p className="text-[10px] text-amber-700 uppercase font-semibold">Review</p>
                    <p className="text-base font-bold text-amber-700 mt-0.5">
                      {member.tasks.inReview}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50/60 rounded-lg">
                    <p className="text-[10px] text-emerald-700 uppercase font-semibold">Done</p>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">
                      {member.tasks.completed}
                    </p>
                  </div>
                </div>

                {/* Overdue Warning if any */}
                {member.tasks.overdue > 0 && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{member.tasks.overdue} overdue task(s) require attention</span>
                  </div>
                )}

                {/* Active Task Snippets */}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Current Task Focus
                  </p>
                  {member.tasks.items && member.tasks.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {member.tasks.items.slice(0, 3).map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedTask(item)}
                          className="p-2 bg-slate-50 hover:bg-brand-50/50 rounded-lg border border-slate-100 text-xs flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono text-[10px] text-slate-400 mr-1.5">
                              {item.taskId}
                            </span>
                            <span className="font-medium text-slate-800">{item.title}</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              item.status === "IN_PROGRESS"
                                ? "bg-brand-100 text-brand-700"
                                : item.status === "REVIEW"
                                ? "bg-amber-100 text-amber-700"
                                : item.status === "BLOCKED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-1">
                      No active tasks currently assigned. Available for delegation.
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleOpenAssign(member.id)}
                  className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Task</span>
                </button>

                <Link
                  href="/chat"
                  className="p-2 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 rounded-xl text-slate-600 hover:text-brand-600 transition"
                  title="Direct Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Creation Modal with Assignee Preselected */}
      {isCreateTaskOpen && (
        <TaskCreateModal
          onClose={() => setIsCreateTaskOpen(false)}
          onSuccess={() => {
            fetchWorkload();
            setActionNotice("Task assigned successfully to team member! 🚀");
            setIsCreateTaskOpen(false);
            setTimeout(() => setActionNotice(null), 3500);
          }}
          preselectedAssigneeId={preselectedAssignee}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchWorkload();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
