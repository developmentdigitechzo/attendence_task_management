"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Filter,
  Kanban,
  List,
  AlertTriangle,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  FolderGit2,
} from "lucide-react";
import TaskCreateModal from "./TaskCreateModal";
import TaskDetailModal from "./TaskDetailModal";
import { formatDateDisplay } from "@/lib/utils";
import { toast } from "@/components/ui/ToastProvider";

interface TasksViewProps {
  currentUserId: string;
  userRole: string;
  defaultFilter?: "all" | "my";
}

export default function TasksView({
  currentUserId,
  userRole,
  defaultFilter = "all",
}: TasksViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERDUE" | "HIGH_PRIORITY" | "COMPLETED">("ALL");
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const isManagerOrAdmin = userRole === "SUPER_ADMIN" || userRole === "MANAGER";

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (defaultFilter === "my" || userRole === "EMPLOYEE") {
        params.set("filter", "my");
      }
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (projectFilter !== "ALL") params.set("projectId", projectFilter);

      const [tasksRes, projRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch("/api/projects"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, projectFilter]);

  const STATUS_LABELS: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    COMPLETED: "Completed",
    BLOCKED: "Blocked",
  };

  // Employees may only move tasks assigned to them
  const canMoveTask = (t: any) => isManagerOrAdmin || t.assignedTo?.id === currentUserId;

  const moveTask = async (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    if (!canMoveTask(task)) {
      toast.error("You can only move tasks assigned to you.");
      return;
    }

    const previousStatus = task.status;
    const previousCompletedAt = task.completedAt;

    // Optimistic update – card jumps immediately, rolled back on failure
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-skip-toast": "1" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to move task.");
      }
      toast.success(`${task.taskId} moved to ${STATUS_LABELS[newStatus]}`);
    } catch (e: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: previousStatus, completedAt: previousCompletedAt } : t
        )
      );
      toast.error(e?.message || "Could not move task. Reverted.");
    }
  };

  const handleDragStart = (e: React.DragEvent, t: any) => {
    if (!canMoveTask(t)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", t.id); // required for Firefox
    setDraggingId(t.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    if (!draggingId) return;
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const id = draggingId || e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    setDragOverCol(null);
    if (id) moveTask(id, colId);
  };

  // Tab filtering
  let displayTasks = tasks;
  if (activeTab === "OVERDUE") {
    displayTasks = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()
    );
  } else if (activeTab === "HIGH_PRIORITY") {
    displayTasks = tasks.filter((t) => t.priority === "HIGH" || t.priority === "URGENT");
  } else if (activeTab === "COMPLETED") {
    displayTasks = tasks.filter((t) => t.status === "COMPLETED");
  }

  // Factual productivity statistics (Section 17: non-judgmental metrics)
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const kanbanColumns = [
    { id: "TODO", name: "To Do", bg: "bg-slate-50", badge: "bg-slate-200 text-slate-700" },
    { id: "IN_PROGRESS", name: "In Progress", bg: "bg-brand-50/40", badge: "bg-brand-100 text-brand-700" },
    { id: "REVIEW", name: "Review", bg: "bg-amber-50/40", badge: "bg-amber-100 text-amber-700" },
    { id: "COMPLETED", name: "Completed", bg: "bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" },
    { id: "BLOCKED", name: "Blocked", bg: "bg-rose-50/40", badge: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {defaultFilter === "my" ? "My Assigned Tasks" : "Task & Deliverable Management"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track accountability, upcoming deadlines, and task progress
          </p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Factual Productivity Metrics Bar (Section 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Completion Rate</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{completionRate}%</p>
          <span className="text-[10px] text-slate-500">{completedCount} of {totalCount} completed</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">In Progress</p>
          <p className="text-xl font-bold text-brand-600 mt-1">{inProgressCount}</p>
          <span className="text-[10px] text-slate-500">Active development</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Overdue</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{overdueCount}</p>
          <span className="text-[10px] text-rose-500">Requires follow-up</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Blocked</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{blockedCount}</p>
          <span className="text-[10px] text-slate-500">Impediments reported</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs card-hover">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Total Tasks</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
          <span className="text-[10px] text-slate-500">In workflow</span>
        </div>
      </div>

      {/* Filter Tabs & View Mode Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 card-hover">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "ALL" ? "bg-brand-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("HIGH_PRIORITY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "HIGH_PRIORITY"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            High Priority
          </button>
          <button
            onClick={() => setActiveTab("OVERDUE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "OVERDUE" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "COMPLETED" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Filters & View Mode */}
        <div className="flex items-center gap-3">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Kanban / Table Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === "kanban" ? "bg-white shadow-xs text-brand-600" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Kanban View"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === "table" ? "bg-white shadow-xs text-brand-600" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Task Display: Kanban vs Table */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = displayTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragEnter={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => {
                  // only clear when actually leaving the column, not entering a child
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
                }}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl p-3 border min-h-[400px] flex flex-col transition-colors ${
                  dragOverCol === col.id && draggingId
                    ? "bg-brand-50 border-brand-400 border-dashed ring-2 ring-brand-200"
                    : "bg-slate-100/70 border-slate-200/60"
                }`}
              >
                <div className="flex items-center justify-between pb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{col.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${col.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">
                      {draggingId ? "Drop here" : "Empty column"}
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        draggable={canMoveTask(t)}
                        onDragStart={(e) => handleDragStart(e, t)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTask(t)}
                        className={`bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-brand-400 hover:shadow-sm transition space-y-2 select-none ${
                          canMoveTask(t) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                        } ${draggingId === t.id ? "opacity-40 scale-95" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {t.taskId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              t.priority === "URGENT"
                                ? "bg-rose-100 text-rose-700"
                                : t.priority === "HIGH"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {t.title}
                        </h4>

                        {t.project && (
                          <p className="text-[10px] text-brand-600 font-medium truncate flex items-center gap-1">
                            <FolderGit2 className="w-3 h-3" />
                            <span>{t.project.name}</span>
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateDisplay(t.dueDate)}</span>
                          </span>
                          <span className="font-semibold text-slate-600 truncate max-w-[90px]">
                            {t.assignedTo?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">ID & Title</th>
                  <th className="py-3 px-4 font-semibold">Project</th>
                  <th className="py-3 px-4 font-semibold">Assignee</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  displayTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-500">
                            {t.taskId}
                          </span>
                          <span className="font-bold text-slate-900">{t.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.project?.name || "General"}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {t.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.priority === "URGENT"
                              ? "bg-rose-100 text-rose-700"
                              : t.priority === "HIGH"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {formatDateDisplay(t.dueDate)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.status === "IN_PROGRESS"
                              ? "bg-brand-50 text-brand-700 border border-brand-200"
                              : t.status === "BLOCKED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <TaskCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchTasks();
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUserId={currentUserId}
          userRole={userRole}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchTasks();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
