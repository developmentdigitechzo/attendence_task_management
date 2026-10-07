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
  Edit3,
  Trash2,
  Users,
  Search,
  Filter,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";
import TaskCreateModal from "@/components/tasks/TaskCreateModal";

export default function ProjectsView({ userRole }: { userRole: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"PROJECTS" | "MILESTONES">("PROJECTS");
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("ALL");
  const [milestoneProjectFilter, setMilestoneProjectFilter] = useState("ALL");
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState("ALL");

  // Selected project for detail modal
  const [viewingProject, setViewingProject] = useState<any | null>(null);

  // Project Create/Edit modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Milestone Create/Edit modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneProjectId, setMilestoneProjectId] = useState("");
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneStatus, setMilestoneStatus] = useState("IN_PROGRESS");
  const [milestoneStart, setMilestoneStart] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [submittingMilestone, setSubmittingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

  // Task create modal linked to project/milestone
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetProjectId, setTaskTargetProjectId] = useState<string | undefined>(undefined);
  const [taskTargetMilestoneId, setTaskTargetMilestoneId] = useState<string | undefined>(undefined);

  const isManagerOrAdmin = userRole === "SUPER_ADMIN" || userRole === "MANAGER";

  const fetchAllData = async () => {
    if (userRole === "EMPLOYEE") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [projRes, mileRes, empRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/milestones"),
        fetch("/api/employees"),
      ]);

      if (projRes.ok) {
        const data = await projRes.json();
        const projs = data.projects || [];
        setProjects(projs);
        if (projs.length > 0 && !milestoneProjectId) {
          setMilestoneProjectId(projs[0].id);
        }
        // Update currently viewed project if open
        if (viewingProject) {
          const updated = projs.find((p: any) => p.id === viewingProject.id);
          if (updated) setViewingProject(updated);
        }
      }

      if (mileRes.ok) {
        const mData = await mileRes.json();
        setMilestones(mData.milestones || []);
      }

      if (empRes.ok) {
        const eData = await empRes.json();
        setEmployees(eData.employees || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Open Create Project Modal
  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    setName("");
    setClient("");
    setDescription("");
    setStatus("ACTIVE");
    setStartDate("");
    setDeadline("");
    setSelectedMemberIds([]);
    setProjectError(null);
    setIsProjectModalOpen(true);
  };

  // Open Edit Project Modal
  const openEditProjectModal = (proj: any) => {
    setEditingProjectId(proj.id);
    setName(proj.name || "");
    setClient(proj.client || "");
    setDescription(proj.description || "");
    setStatus(proj.status || "ACTIVE");
    setStartDate(proj.startDate ? proj.startDate.split("T")[0] : "");
    setDeadline(proj.deadline ? proj.deadline.split("T")[0] : "");
    setSelectedMemberIds(proj.members?.map((m: any) => m.userId || m.user?.id) || []);
    setProjectError(null);
    setIsProjectModalOpen(true);
  };

  // Submit Project (Create or Edit)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProjectError("Project name is required.");
      return;
    }

    setSubmittingProject(true);
    setProjectError(null);
    try {
      const url = "/api/projects";
      const method = editingProjectId ? "PATCH" : "POST";
      const payload: any = {
        name,
        client,
        description,
        status,
        startDate: startDate || null,
        deadline: deadline || null,
        memberIds: selectedMemberIds,
      };
      if (editingProjectId) {
        payload.id = editingProjectId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setProjectError(data.error || "Failed to save project.");
      } else {
        setIsProjectModalOpen(false);
        fetchAllData();
      }
    } catch {
      setProjectError("Network error saving project.");
    } finally {
      setSubmittingProject(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projId: string, projName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projName}"? Linked milestones will be removed and tasks unlinked.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects?id=${projId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (viewingProject?.id === projId) {
          setViewingProject(null);
        }
        fetchAllData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete project.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting project.");
    }
  };

  // Open Create Milestone Modal
  const openCreateMilestoneModal = async (preselectedProjId?: string) => {
    let currentProjects = projects;
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        currentProjects = data.projects || [];
        setProjects(currentProjects);
      }
    } catch (e) {
      console.error(e);
    }

    const validId =
      preselectedProjId && currentProjects.some((p) => p.id === preselectedProjId)
        ? preselectedProjId
        : currentProjects[0]?.id || "";

    setEditingMilestoneId(null);
    setMilestoneProjectId(validId);
    setMilestoneName("");
    setMilestoneDesc("");
    setMilestoneStatus("IN_PROGRESS");
    setMilestoneStart("");
    setMilestoneDue("");
    setMilestoneError(null);
    setIsMilestoneModalOpen(true);
  };

  // Open Edit Milestone Modal
  const openEditMilestoneModal = (m: any) => {
    setEditingMilestoneId(m.id);
    setMilestoneProjectId(m.projectId || m.project?.id || "");
    setMilestoneName(m.name || "");
    setMilestoneDesc(m.description || "");
    setMilestoneStatus(m.status || "IN_PROGRESS");
    setMilestoneStart(m.startDate ? m.startDate.split("T")[0] : "");
    setMilestoneDue(m.dueDate ? m.dueDate.split("T")[0] : "");
    setMilestoneError(null);
    setIsMilestoneModalOpen(true);
  };

  // Submit Milestone (Create or Edit)
  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    const validProjId =
      projects.find((p) => p.id === milestoneProjectId)?.id ||
      projects[0]?.id ||
      milestoneProjectId;

    if (!validProjId || !milestoneName.trim()) {
      setMilestoneError("Project and Milestone title are required.");
      return;
    }

    setSubmittingMilestone(true);
    setMilestoneError(null);
    try {
      const url = "/api/milestones";
      const method = editingMilestoneId ? "PATCH" : "POST";
      const payload: any = {
        projectId: validProjId,
        name: milestoneName.trim(),
        description: milestoneDesc ? milestoneDesc.trim() : null,
        status: milestoneStatus,
        startDate: milestoneStart || null,
        dueDate: milestoneDue || null,
      };
      if (editingMilestoneId) {
        payload.id = editingMilestoneId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMilestoneError(data.error || "Failed to save milestone.");
      } else {
        setIsMilestoneModalOpen(false);
        fetchAllData();
      }
    } catch {
      setMilestoneError("Network error saving milestone.");
    } finally {
      setSubmittingMilestone(false);
    }
  };

  // Delete Milestone
  const handleDeleteMilestone = async (milestoneId: string, mName: string) => {
    if (!confirm(`Are you sure you want to delete milestone "${mName}"? Tasks will remain safe and unlinked.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/milestones?id=${milestoneId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete milestone.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting milestone.");
    }
  };

  // Toggle Milestone Status (Completed <-> In Progress)
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

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(projectSearch.toLowerCase())) ||
      (p.client && p.client.toLowerCase().includes(projectSearch.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(projectSearch.toLowerCase()));

    const matchesStatus =
      projectStatusFilter === "ALL" || p.status === projectStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered milestones
  const filteredMilestones = milestones.filter((m) => {
    const matchesProject =
      milestoneProjectFilter === "ALL" ||
      m.projectId === milestoneProjectFilter ||
      m.project?.id === milestoneProjectFilter;

    const matchesStatus =
      milestoneStatusFilter === "ALL" || m.status === milestoneStatusFilter;

    return matchesProject && matchesStatus;
  });

  if (userRole === "EMPLOYEE") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Projects & Milestones are managed exclusively by Administrators and Team Leads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider">
              WorkOS Agile Management
            </span>
            <span className="text-xs text-slate-400 font-medium">Projects & Milestones</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Projects & Roadmaps
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage projects, sprint milestones, deliverables, and team task progress in one unified view.
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openCreateMilestoneModal()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
            <button
              onClick={openCreateProjectModal}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
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
          <span>Milestones & Roadmaps ({milestones.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL PROJECTS */}
      {activeTab === "PROJECTS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects or clients..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PLANNING">Planning</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-28 bg-slate-200 rounded-full skeleton-shimmer" />
                    <div className="h-4 w-16 bg-slate-200 rounded-full skeleton-shimmer" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-slate-200 rounded-lg skeleton-shimmer" />
                    <div className="h-3.5 w-full bg-slate-100 rounded skeleton-shimmer" />
                    <div className="h-3.5 w-2/3 bg-slate-100 rounded skeleton-shimmer" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-slate-100 rounded-md skeleton-shimmer" />
                    <div className="h-5 w-20 bg-slate-100 rounded-md skeleton-shimmer" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="h-2 w-full bg-slate-200 rounded-full skeleton-shimmer" />
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-3.5 w-24 bg-slate-100 rounded skeleton-shimmer" />
                      <div className="h-6 w-16 bg-slate-200 rounded-full skeleton-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No matching projects found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-brand-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Client & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                        {proj.client || "Internal Digitechzo"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          proj.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : proj.status === "PLANNING"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : proj.status === "ON_HOLD"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3
                      onClick={() => setViewingProject(proj)}
                      className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition cursor-pointer leading-snug"
                    >
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {proj.description || "No project overview provided."}
                    </p>

                    {/* Milestones & Tasks quick pill count */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        {proj.completedMilestones || 0}/{proj.totalMilestones || 0} Milestones
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {proj.completedTasks || 0}/{proj.totalTasks || 0} Tasks
                      </span>
                    </div>
                  </div>

                  {/* Progress & Bottom Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Task Completion</span>
                        <span className="font-mono text-brand-600 font-bold">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            proj.progress === 100 ? "bg-emerald-500" : "bg-brand-600"
                          }`}
                          style={{ width: `${proj.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {formatDateDisplay(proj.deadline)}</span>
                      </div>

                      {/* Member Avatars */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {proj.members?.slice(0, 4).map((m: any) => (
                          <div
                            key={m.id}
                            title={`${m.user.name} (${m.role})`}
                            className="w-6 h-6 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
                          >
                            {m.user?.name ? m.user.name[0] : "U"}
                          </div>
                        ))}
                        {(proj.members?.length || 0) > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                            +{proj.members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <button
                        onClick={() => setViewingProject(proj)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {isManagerOrAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditProjectModal(proj)}
                            title="Edit Project"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id, proj.name)}
                            title="Delete Project"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MILESTONES & ROADMAPS */}
      {activeTab === "MILESTONES" && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="p-4 bg-gradient-to-r from-brand-50 via-amber-50 to-emerald-50 rounded-2xl border border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-600/20">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Agile Sprint Milestones & Deliverable Roadmaps
                </h3>
                <p className="text-xs text-slate-600">
                  Track sprint objectives and automatic task completion velocities per milestone.
                </p>
              </div>
            </div>

            {isManagerOrAdmin && (
              <button
                onClick={() => openCreateMilestoneModal()}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-auto flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Milestone</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Project:</span>
              <select
                value={milestoneProjectFilter}
                onChange={(e) => setMilestoneProjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
              >
                <option value="ALL">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={milestoneStatusFilter}
                onChange={(e) => setMilestoneStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1 max-w-xl">
                      <div className="flex gap-2">
                        <div className="h-4 w-28 bg-slate-200 rounded-full skeleton-shimmer" />
                        <div className="h-4 w-20 bg-slate-200 rounded-full skeleton-shimmer" />
                      </div>
                      <div className="h-5 w-1/2 bg-slate-200 rounded-lg skeleton-shimmer" />
                      <div className="h-3.5 w-3/4 bg-slate-100 rounded skeleton-shimmer" />
                    </div>
                    <div className="h-8 w-24 bg-slate-100 rounded-xl skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMilestones.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No milestones found. Click &quot;Add Milestone&quot; to link tasks to sprint roadmaps.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMilestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-brand-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {m.project?.name || "Global Project"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.status === "IN_PROGRESS"
                              ? "bg-brand-50 text-brand-700 border-brand-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
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
                        <>
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
                          <button
                            onClick={() => openEditMilestoneModal(m)}
                            title="Edit Milestone"
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(m.id, m.name)}
                            title="Delete Milestone"
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
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
                      {m.startDate && <span>Start: {formatDateDisplay(m.startDate)}</span>}
                      <span>Target Due: {formatDateDisplay(m.dueDate)}</span>
                    </div>

                    {/* Linked task badges & Add Task button */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {m.tasks && m.tasks.length > 0 && (
                        m.tasks.map((t: any) => (
                          <span
                            key={t.id}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 line-through"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {t.taskId}: {t.title}
                          </span>
                        ))
                      )}

                      {isManagerOrAdmin && (
                        <button
                          onClick={() => {
                            setTaskTargetProjectId(m.projectId || m.project?.id);
                            setTaskTargetMilestoneId(m.id);
                            setIsTaskModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline px-1 py-0.5"
                        >
                          + Add Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROJECT DETAIL MODAL */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {viewingProject.client || "Internal"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      viewingProject.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {viewingProject.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{viewingProject.name}</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {viewingProject.description || "No project description provided."}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {isManagerOrAdmin && (
                  <button
                    onClick={() => {
                      const p = viewingProject;
                      setViewingProject(null);
                      openEditProjectModal(p);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingProject(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Timeline
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {formatDateDisplay(viewingProject.startDate)} - {formatDateDisplay(viewingProject.deadline)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Milestones
                </span>
                <p className="text-xs font-bold text-amber-600 mt-0.5">
                  {viewingProject.completedMilestones || 0} / {viewingProject.totalMilestones || 0} Finished
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Tasks Done
                </span>
                <p className="text-xs font-bold text-brand-600 mt-0.5">
                  {viewingProject.completedTasks || 0} / {viewingProject.totalTasks || 0} Tasks
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Overall Progress
                </span>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                  {viewingProject.progress || 0}% Complete
                </p>
              </div>
            </div>

            {/* Team Members Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>Assigned Team Members ({viewingProject.members?.length || 0})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {viewingProject.members?.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5 shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {m.user?.name ? m.user.name[0] : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.user?.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {m.user?.designation || m.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-amber-500" />
                  <span>Project Milestones ({viewingProject.milestones?.length || 0})</span>
                </h3>
                {isManagerOrAdmin && (
                  <button
                    onClick={() => openCreateMilestoneModal(viewingProject.id)}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                )}
              </div>

              {viewingProject.milestones?.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No milestones added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingProject.milestones?.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{m.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                m.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-brand-100 text-brand-800"
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                          {m.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isManagerOrAdmin && (
                            <button
                              onClick={() => handleToggleMilestoneStatus(m.id, m.status)}
                              className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
                            >
                              {m.status === "COMPLETED" ? "Re-open" : "Mark Done"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
                          <span>Progress</span>
                          <span>{m.progress}% ({m.completedTasks}/{m.totalTasks} tasks)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.progress === 100 ? "bg-emerald-500" : "bg-brand-600"
                            }`}
                            style={{ width: `${m.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                  <span>Tasks in Project ({viewingProject.tasks?.length || 0})</span>
                </h3>
                {isManagerOrAdmin && (
                  <button
                    onClick={() => {
                      setTaskTargetProjectId(viewingProject.id);
                      setTaskTargetMilestoneId(undefined);
                      setIsTaskModalOpen(true);
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>

              {viewingProject.tasks?.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No tasks assigned to this project yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {viewingProject.tasks?.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.taskId}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{t.title}</p>
                          <p className="text-[10px] text-slate-400">
                            Assigned to: {t.assignedTo?.name || "Unassigned"} • Due: {formatDateDisplay(t.dueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingProjectId ? "Edit Project" : "Create New Project"}
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{projectError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Enterprise Cloud Portal"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. Internal / Global Corp"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PLANNING">Planning</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Description & Goals
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key deliverables, scope, and objectives..."
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

              {/* Team Members Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assign Team Members
                </label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-36 overflow-y-auto space-y-2">
                  {employees.map((emp) => {
                    const isSelected = selectedMemberIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:bg-white p-1 rounded-lg transition"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds((prev) => [...prev, emp.id]);
                            } else {
                              setSelectedMemberIds((prev) => prev.filter((id) => id !== emp.id));
                            }
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({emp.role})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProject}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingProject ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingProjectId ? (
                    "Update Project"
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MILESTONE MODAL */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingMilestoneId ? "Edit Milestone" : "Add Sprint Milestone"}
                </h3>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {milestoneError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{milestoneError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMilestone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={
                    projects.some((p) => p.id === milestoneProjectId)
                      ? milestoneProjectId
                      : projects[0]?.id || ""
                  }
                  onChange={(e) => setMilestoneProjectId(e.target.value)}
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
                  placeholder="e.g. Phase 2: Live Attendance & Break Tracking"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={milestoneStatus}
                  onChange={(e) => setMilestoneStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Scope & Criteria
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
                  className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingMilestone ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingMilestoneId ? (
                    "Update Milestone"
                  ) : (
                    "Save Milestone"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK CREATE MODAL */}
      {isTaskModalOpen && (
        <TaskCreateModal
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskTargetProjectId(undefined);
            setTaskTargetMilestoneId(undefined);
          }}
          onSuccess={() => {
            fetchAllData();
          }}
          preselectedProjectId={taskTargetProjectId}
          preselectedMilestoneId={taskTargetMilestoneId}
        />
      )}
    </div>
  );
}
