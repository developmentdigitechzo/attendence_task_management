"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Filter,
  Kanban,
  List,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FolderGit2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { promptAction } from "@/components/ui/ConfirmDialog";

export default function LeadTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"REVIEW_QUEUE" | "ALL_KANBAN" | "ALL_TABLE">("REVIEW_QUEUE");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterProject, setFilterProject] = useState("ALL");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const [allRes, reviewRes, projRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/tasks?status=REVIEW"),
        fetch("/api/projects"),
      ]);

      if (allRes.ok) {
        const data = await allRes.json();
        setTasks(data.tasks || []);
      }
      if (reviewRes.ok) {
        const rData = await reviewRes.json();
        setReviewTasks(rData.tasks || []);
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
    fetchTasksData();
  }, []);

  const handleApprove = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "COMPLETED" }),
      });
      if (res.ok) {
        setActionNotice("Task approved and marked as Completed! 🎉");
        fetchTasksData();
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestChanges = async (taskId: string) => {
    const feedback = await promptAction({
      title: "Request Task Changes",
      message: "Specify feedback or required modifications for the team member before they resubmit.",
      confirmText: "Request Changes",
      variant: "danger",
      noteLabel: "Feedback / Changes Requested",
      notePlaceholder: "Detail what needs to be changed or improved...",
    });
    if (!feedback || !feedback.trim()) return;

    try {
      await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content: `[Requested Changes by Team Lead]: ${feedback}` }),
      });
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "IN_PROGRESS" }),
      });
      setActionNotice("Task returned to In Progress with your review feedback.");
      fetchTasksData();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const matchesProject = filterProject === "ALL" || t.projectId === filterProject;
    return matchesPriority && matchesProject;
  });

  const kanbanColumns = [
    { id: "TODO", name: "To Do", bg: "bg-slate-100", badge: "bg-slate-200 text-slate-700" },
    { id: "IN_PROGRESS", name: "In Progress", bg: "bg-brand-50", badge: "bg-brand-100 text-brand-700" },
    { id: "REVIEW", name: "Review Queue", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
    { id: "COMPLETED", name: "Completed", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700" },
    { id: "BLOCKED", name: "Blocked", bg: "bg-rose-50", badge: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
              Nifty-Style Quality Gate
            </span>
            <span className="text-xs text-slate-400 font-medium">Team Lead Review</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Task Review Queue & Team Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve completed deliverables, request revisions, and oversee team sprint progress
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Delegate Task</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs panel-hover">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("REVIEW_QUEUE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "REVIEW_QUEUE"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Queue</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === "REVIEW_QUEUE"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {reviewTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ALL_KANBAN")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ALL_KANBAN"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Team Kanban Board</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === "ALL_KANBAN"
                  ? "bg-brand-800 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ALL_TABLE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ALL_TABLE"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === "REVIEW_QUEUE" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-950">
                  {reviewTasks.length} Task(s) Awaiting Lead Approval
                </h3>
                <p className="text-xs text-amber-800">
                  Employees have marked these items complete. Inspect code/deliverables, then approve or request modifications.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading review queue...</div>
          ) : reviewTasks.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Review Queue is Clear!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No tasks are currently waiting for your review. When team members finish assignments, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border-2 border-amber-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {t.taskId}
                        </span>
                        {t.project && (
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                            <FolderGit2 className="w-3 h-3 text-brand-500" />
                            {t.project.name}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === "URGENT"
                            ? "bg-rose-100 text-rose-700"
                            : t.priority === "HIGH"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <h3
                      onClick={() => setSelectedTask(t)}
                      className="font-bold text-base text-slate-900 leading-snug hover:text-brand-600 cursor-pointer"
                    >
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {t.description || "No description provided."}
                    </p>

                    {/* Assignee & Due Date */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {t.assignedTo?.name?.[0] || "U"}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {t.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {formatDateDisplay(t.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(t.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Complete</span>
                    </button>

                    <button
                      onClick={() => handleRequestChanges(t.id)}
                      className="py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Changes</span>
                    </button>

                    <button
                      onClick={() => setSelectedTask(t)}
                      className="py-2 px-3 text-brand-600 hover:bg-brand-50 rounded-xl text-xs font-semibold transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KANBAN BOARD */}
      {activeTab === "ALL_KANBAN" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/60 min-h-[450px] flex flex-col"
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
                      Empty column
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-brand-400 hover:shadow-sm transition cursor-pointer space-y-2"
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
      )}

      {/* TAB 3: TABLE VIEW */}
      {activeTab === "ALL_TABLE" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                    {t.taskId}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span
                      onClick={() => setSelectedTask(t)}
                      className="cursor-pointer hover:text-brand-600"
                    >
                      {t.title}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {t.project?.name || "General"}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {t.assignedTo?.name || "Unassigned"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === "URGENT"
                          ? "bg-rose-100 text-rose-700"
                          : t.priority === "HIGH"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : t.status === "REVIEW"
                          ? "bg-amber-100 text-amber-700"
                          : t.status === "IN_PROGRESS"
                          ? "bg-brand-100 text-brand-700"
                          : t.status === "BLOCKED"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatDateDisplay(t.dueDate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-2.5 py-1 text-xs text-brand-600 hover:bg-brand-50 rounded-lg font-medium"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateOpen && (
        <TaskCreateModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            fetchTasksData();
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchTasksData();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
