"use client";

import { useState } from "react";
import {
  X,
  Clock,
  Calendar,
  User,
  AlertCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Paperclip,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

interface TaskDetailModalProps {
  task: any;
  currentUserId?: string;
  userRole?: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({
  task,
  currentUserId = "",
  userRole = "MANAGER",
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const [status, setStatus] = useState(task.status);
  const [comments, setComments] = useState<any[]>(task.comments || []);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      if (res.ok) {
        onUpdate();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, content: newComment }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                {task.taskId}
              </span>
              {task.project && (
                <span className="text-[11px] font-medium text-slate-500">
                  in <strong className="text-slate-700">{task.project.name}</strong>
                </span>
              )}
              {task.milestone && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  🎯 {task.milestone.name}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <p className="text-slate-400 font-medium mb-1">Status</p>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="w-full bg-white font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Priority</p>
              <span
                className={`inline-block font-semibold px-2 py-1 rounded text-[11px] ${
                  task.priority === "URGENT"
                    ? "bg-rose-100 text-rose-700"
                    : task.priority === "HIGH"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {task.priority}
              </span>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Assigned To</p>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{task.assignedTo?.name || "Unassigned"}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Due Date</p>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDateDisplay(task.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Description
            </h4>
            <div className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100 whitespace-pre-line min-h-[60px]">
              {task.description || "No description provided."}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
              <span>Activity & Comments ({comments.length})</span>
            </h4>

            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet. Be the first to comment.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center text-[10px] shrink-0">
                      {c.user.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{c.user.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment or status update..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
