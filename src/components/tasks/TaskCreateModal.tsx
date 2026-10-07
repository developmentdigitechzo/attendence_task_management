"use client";

import { useState, useEffect } from "react";
import { X, CheckSquare, AlertCircle } from "lucide-react";
import { AntdFormItem, AntdInput, AntdTextarea, AntdSelect, AntdButton } from "@/components/ui/AntdUI";

export default function TaskCreateModal({
  onClose,
  onSuccess,
  preselectedAssigneeId,
  preselectedProjectId,
  preselectedMilestoneId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  preselectedAssigneeId?: string;
  preselectedProjectId?: string;
  preselectedMilestoneId?: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(preselectedProjectId || "");
  const [milestoneId, setMilestoneId] = useState(preselectedMilestoneId || "");
  const [assignedToId, setAssignedToId] = useState(preselectedAssigneeId || "");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedAssigneeId) {
      setAssignedToId(preselectedAssigneeId);
    }
  }, [preselectedAssigneeId]);

  useEffect(() => {
    // Load projects and employees
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
    ])
      .then(([projData, empData]) => {
        setProjects(projData.projects || []);
        setEmployees(empData.employees || []);
        if (preselectedAssigneeId) {
          setAssignedToId(preselectedAssigneeId);
        }
      })
      .catch(console.error);
  }, [preselectedAssigneeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          projectId: projectId || null,
          milestoneId: milestoneId || null,
          assignedToId: assignedToId || null,
          priority,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create task.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Network error creating task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)] border border-[#f0f0f0] animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] flex flex-col">
        {/* Antd Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <div>
            <h3 className="font-semibold text-base text-slate-800 leading-snug">Create New Task</h3>
            <p className="text-xs text-slate-400 mt-0.5">Assign work or deliverables to a team member</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-[#fff2f0] text-[#cf1322] text-xs rounded border border-[#ffccc7] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="task-create-form" onSubmit={handleSubmit} className="space-y-1">
            <AntdFormItem label="Task Title" required>
              <AntdInput
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Homepage Wireframes"
              />
            </AntdFormItem>

            <AntdFormItem label="Description">
              <AntdTextarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed instructions, specs, or acceptance criteria..."
              />
            </AntdFormItem>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <AntdFormItem label="Project">
                <AntdSelect
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">No Project (General)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </AntdSelect>
              </AntdFormItem>

              <AntdFormItem label="Assign To">
                <AntdSelect
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department?.name || "General"})
                    </option>
                  ))}
                </AntdSelect>
              </AntdFormItem>
            </div>

            {projectId && (
              <AntdFormItem label="Project Milestone (Optional)">
                <AntdSelect
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                >
                  <option value="">No Milestone Linked</option>
                  {projects
                    .find((p) => p.id === projectId)
                    ?.milestones?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        🎯 {m.name} ({m.status})
                      </option>
                    ))}
                </AntdSelect>
              </AntdFormItem>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <AntdFormItem label="Priority">
                <AntdSelect
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent ⚡</option>
                </AntdSelect>
              </AntdFormItem>

              <AntdFormItem label="Due Date">
                <AntdInput
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </AntdFormItem>
            </div>
          </form>
        </div>

        {/* Antd Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[#f0f0f0] bg-slate-50/50 rounded-b-lg">
          <AntdButton type="default" onClick={onClose}>
            Cancel
          </AntdButton>
          <AntdButton
            type="primary"
            loading={submitting}
            icon={<CheckSquare className="w-3.5 h-3.5" />}
            onClick={() => {
              const form = document.getElementById("task-create-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            Create Task
          </AntdButton>
        </div>
      </div>
    </div>
  );
}
