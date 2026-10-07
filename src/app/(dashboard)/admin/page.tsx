"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckSquare,
  AlertTriangle,
  CalendarDays,
  Play,
  UserPlus,
  FileBarChart2,
  Bell,
  ArrowUpRight,
  Coffee,
  CheckCircle2,
} from "lucide-react";
import { formatTimeIST, formatMinutes, getTodayDateString } from "@/lib/utils";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";
import EmployeeModal from "@/components/employees/EmployeeModal";
import { AntdButton } from "@/components/ui/AntdUI";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [leavesCount, setLeavesCount] = useState(0);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [attRes, tasksRes, logsRes, leaveRes] = await Promise.all([
        fetch("/api/attendance/overview"),
        fetch("/api/tasks"),
        fetch("/api/audit"),
        fetch("/api/leave?status=PENDING"),
      ]);

      if (attRes.ok) setOverview(await attRes.json());
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setAuditLogs(lData.logs?.slice(0, 6) || []);
      }
      if (leaveRes.ok) {
        const lvData = await leaveRes.json();
        setLeavesCount(lvData.leaves?.length || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(timer);
  }, []);

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  const stats = overview?.stats || {
    totalEmployees: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    currentlyWorking: 0,
    notCheckedIn: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workforce Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workforce attendance, active tasks & team operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <AntdButton
            type="default"
            icon={<CheckSquare className="w-3.5 h-3.5 text-brand-600" />}
            onClick={() => setIsTaskModalOpen(true)}
            className="!h-9"
          >
            Assign Task
          </AntdButton>

          <AntdButton
            type="primary"
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={() => setIsEmployeeModalOpen(true)}
            className="!h-9"
          >
            Onboard Employee
          </AntdButton>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Antd Card style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-3.5">
        {/* Total Active */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Team</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalEmployees}</p>
          <span className="text-[10px] text-slate-400">Active Staff</span>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Present</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {stats.present} <span className="text-xs text-slate-400 font-normal">/ {stats.totalEmployees}</span>
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {stats.totalEmployees > 0 ? Math.round((stats.present / stats.totalEmployees) * 100) : 0}% Turnout
          </span>
        </div>

        {/* Currently Working */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-brand-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Working</span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse"></span>
          </div>
          <p className="text-2xl font-bold text-brand-600 mt-2">{stats.currentlyWorking}</p>
          <span className="text-[10px] text-brand-600 font-medium">Checked In Now</span>
        </div>

        {/* Late Today */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Late</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.late}</p>
          <span className="text-[10px] text-amber-600 font-medium">Past 09:15 AM</span>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tasks</span>
            <CheckSquare className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{pendingTasks}</p>
          <span className="text-[10px] text-slate-400">Pending Execution</span>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Overdue</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{overdueTasks}</p>
          <span className="text-[10px] text-rose-600 font-medium">Needs Attention</span>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between text-ink-600">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Leave</span>
            <CalendarDays className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-ink-600 mt-2">{leavesCount}</p>
          <span className="text-[10px] text-ink-600 font-medium">Requests Pending</span>
        </div>
      </div>

      {/* Main Grid: Today's Live Attendance Table & Tasks Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Attendance Table (2 Columns wide) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#f0f0f0] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0f0f0]">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span>Today's Live Attendance</span>
                <span className="text-[11px] font-normal text-slate-400 font-mono">
                  ({getTodayDateString()})
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">Live employee check-in timestamps and durations</p>
            </div>
            <Link
              href="/admin/attendance"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
            >
              <span>Full Attendance Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto pb-1">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[540px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Check In</th>
                  <th className="pb-3 font-semibold">Check Out</th>
                  <th className="pb-3 font-semibold">Hours</th>
                  <th className="pb-3 font-semibold text-right">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={`admin-live-skel-${i}`} className="animate-pulse">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 skeleton-shimmer shrink-0" />
                          <div className="space-y-1.5 min-w-0">
                            <div className="w-24 h-3 bg-slate-200 rounded skeleton-shimmer" />
                            <div className="w-16 h-2 bg-slate-100 rounded skeleton-shimmer" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3"><div className="w-16 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                      <td className="py-3"><div className="w-12 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                      <td className="py-3"><div className="w-12 h-3 bg-slate-200 rounded skeleton-shimmer" /></td>
                      <td className="py-3"><div className="w-14 h-4 bg-slate-200 rounded-full skeleton-shimmer" /></td>
                      <td className="py-3 text-right"><div className="w-14 h-4 bg-slate-200 rounded-full ml-auto skeleton-shimmer" /></td>
                    </tr>
                  ))
                ) : overview?.records?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  overview?.records?.map((rec: any) => (
                    <tr key={rec.userId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-[10px] shrink-0">
                            {rec.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{rec.name}</p>
                            <p className="text-[10px] text-slate-400">{rec.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{rec.department}</td>
                      <td className="py-3 font-mono text-slate-700">
                        {formatTimeIST(rec.checkIn)}
                      </td>
                      <td className="py-3 font-mono text-slate-700">
                        {formatTimeIST(rec.checkOut)}
                      </td>
                      <td className="py-3 font-mono text-slate-700 font-medium">
                        {formatMinutes(rec.workDurationMinutes)}
                      </td>
                      <td className="py-3 text-right">
                        {rec.liveState === "WORKING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Working
                          </span>
                        )}
                        {rec.liveState === "ON_BREAK" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Coffee className="w-3 h-3" />
                            Break
                          </span>
                        )}
                        {rec.liveState === "ON_LEAVE" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ink-50 text-ink-700 border border-ink-200">
                            Leave
                          </span>
                        )}
                        {rec.liveState === "OFFLINE" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Task Overview & Recent Activity */}
        <div className="space-y-6">
          {/* Task Status Overview */}
          <div className="bg-white rounded-lg border border-[#f0f0f0] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Task Overview</h2>
              <Link
                href="/admin/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                View all
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">To Do</span>
                <span className="font-bold text-slate-800">
                  {tasks.filter((t) => t.status === "TODO").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-brand-50/50 border border-brand-100/50">
                <span className="text-brand-800 font-medium">In Progress</span>
                <span className="font-bold text-brand-800">
                  {tasks.filter((t) => t.status === "IN_PROGRESS").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-amber-50/50 border border-amber-100/50">
                <span className="text-amber-800 font-medium">In Review</span>
                <span className="font-bold text-amber-800">
                  {tasks.filter((t) => t.status === "REVIEW").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50/50 border border-emerald-100/50">
                <span className="text-emerald-800 font-medium">Completed</span>
                <span className="font-bold text-emerald-800">
                  {tasks.filter((t) => t.status === "COMPLETED").length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-rose-50/50 border border-rose-100/50">
                <span className="text-rose-800 font-medium">Blocked</span>
                <span className="font-bold text-rose-800">
                  {tasks.filter((t) => t.status === "BLOCKED").length}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Stream / Recent Operational Activity */}
          <div className="bg-white rounded-lg border border-[#f0f0f0] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Recent Operations</h2>
              <Link
                href="/admin/audit"
                className="text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                Full logs
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No activity recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-brand-500 pl-2.5 py-0.5">
                    <p className="text-slate-800 font-medium leading-snug">
                      <strong className="text-brand-700">{log.userName || "System"}:</strong>{" "}
                      {log.details || log.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isTaskModalOpen && (
        <TaskCreateModal
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}

      {isEmployeeModalOpen && (
        <EmployeeModal
          onClose={() => setIsEmployeeModalOpen(false)}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
