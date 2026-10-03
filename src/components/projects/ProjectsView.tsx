"use client";

import { useState, useEffect } from "react";
import {
  FolderGit2,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  X,
  Building,
  Layers,
  Flag,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export default function ProjectsView({ userRole }: { userRole: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"PROJECTS" | "MILESTONES">("PROJECTS");
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // New project state
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New milestone state
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneStart, setMilestoneStart] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projRes, mileRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/milestones"),
      ]);

      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(data.projects || []);
        if (data.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
      if (mileRes.ok) {
        const mData = await mileRes.json();
        setMilestones(mData.milestones || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          client,
          description,
          startDate,
          deadline,
        }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setName("");
        setClient("");
        setDescription("");
        fetchAllData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !milestoneName.trim()) return;
    setSubmittingMilestone(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: milestoneName,
          description: milestoneDesc,
          startDate: milestoneStart || null,
          dueDate: milestoneDue || null,
        }),
      });
      if (res.ok) {
        setIsMilestoneModalOpen(false);
        setMilestoneName("");
        setMilestoneDesc("");
        setMilestoneStart("");
        setMilestoneDue("");
        fetchAllData();
      }
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleToggleMilestoneStatus = async (milestoneId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      await fetch("/api/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestoneId, status: nextStatus }),
      });
      fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const isManagerOrAdmin = userRole === "SUPER_ADMIN" || userRole === "MANAGER";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              Nifty-Inspired Work Management
            </span>
            <span className="text-xs text-slate-400 font-medium">Roadmaps & Sprints</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Projects & Roadmaps
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize tasks into structured project deliverables, milestones, and sprint timelines
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMilestoneModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Switcher: Projects vs Nifty Milestones */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("PROJECTS")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "PROJECTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>All Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MILESTONES")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "MILESTONES"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Nifty Milestones & Roadmaps ({milestones.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL PROJECTS */}
      {activeTab === "PROJECTS" && (
        <>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No active projects. Click &quot;Create Project&quot; to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm hover:border-brand-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                        {proj.client || "Internal"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          proj.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">{proj.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {proj.description || "No project description provided."}
                    </p>
                  </div>

                  {/* Progress Bar & Members */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Task Progress</span>
                        <span>
                          {proj.progress}% ({proj.completedTasks}/{proj.totalTasks})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full transition-all duration-300"
                          style={{ width: `${proj.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {formatDateDisplay(proj.deadline)}</span>
                      </div>

                      {/* Member Avatars */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {proj.members?.slice(0, 4).map((m: any) => (
                          <div
                            key={m.id}
                            title={m.user.name}
                            className="w-6 h-6 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
                          >
                            {m.user.name[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: NIFTY MILESTONES & ROADMAPS */}
      {activeTab === "MILESTONES" && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-brand-50 to-amber-50 rounded-2xl border border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-600/20">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  NiftyPM Agile Milestones & Sprint Progress
                </h3>
                <p className="text-xs text-slate-600">
                  Milestones automatically track child tasks and compute deliverable completion velocity.
                </p>
              </div>
            </div>

            {isManagerOrAdmin && (
              <button
                onClick={() => setIsMilestoneModalOpen(true)}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                + New Milestone
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading milestones...</div>
          ) : milestones.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No milestones defined yet. Click &quot;Add Milestone&quot; to link tasks to sprint goals.
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-brand-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {m.project?.name || "Global Project"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700"
                              : m.status === "IN_PROGRESS"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{m.name}</h3>
                      <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                        {m.description || "No milestone description specified."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {isManagerOrAdmin && (
                        <button
                          onClick={() => handleToggleMilestoneStatus(m.id, m.status)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                            m.status === "COMPLETED"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {m.status === "COMPLETED" ? "✓ Completed (Re-open)" : "Mark Completed"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Milestone Deliverable Progress</span>
                      <span className="font-mono text-brand-600 font-bold">
                        {m.progress}% ({m.completedTasks} / {m.totalTasks} tasks)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.progress === 100 ? "bg-emerald-500" : "bg-brand-600"
                        }`}
                        style={{ width: `${m.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates & Linked Tasks */}
                  <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-4">
                      {m.startDate && (
                        <span>Start: {formatDateDisplay(m.startDate)}</span>
                      )}
                      <span>Target Due: {formatDateDisplay(m.dueDate)}</span>
                    </div>

                    {/* Linked task badges */}
                    {m.tasks && m.tasks.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.tasks.map((t: any) => (
                          <span
                            key={t.id}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 line-through"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {t.taskId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mumbai Kulfi Branding"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Name (Optional)
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. Mumbai Kulfi Delights"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of deliverables..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Add Nifty Milestone</h3>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.client ? `(${p.client})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="e.g. Sprint 1: MVP Architecture & UI"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Deliverable Scope
                </label>
                <textarea
                  rows={2}
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="Summary of goals and criteria for this milestone..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={milestoneStart}
                    onChange={(e) => setMilestoneStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={milestoneDue}
                    onChange={(e) => setMilestoneDue(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMilestone}
                  className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingMilestone ? "Saving..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
