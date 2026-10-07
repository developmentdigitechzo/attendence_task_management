"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  CheckSquare,
  FolderGit2,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export type SearchDetailItem =
  | { type: "employee"; data: any }
  | { type: "task"; data: any }
  | { type: "project"; data: any }
  | { type: "department"; data: any };

interface SearchDetailModalProps {
  item: SearchDetailItem | null;
  onClose: () => void;
  userRole?: string;
}

export default function SearchDetailModal({
  item,
  onClose,
  userRole = "SUPER_ADMIN",
}: SearchDetailModalProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 ease-out">
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
              {item.type === "employee" && <User className="w-5 h-5" />}
              {item.type === "task" && <CheckSquare className="w-5 h-5" />}
              {item.type === "project" && <FolderGit2 className="w-5 h-5" />}
              {item.type === "department" && <Building className="w-5 h-5" />}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.type === "employee" && "Employee Profile"}
                {item.type === "task" && "Task Details"}
                {item.type === "project" && "Project Overview"}
                {item.type === "department" && "Department Info"}
              </span>
              <h3 className="font-bold text-base text-slate-900 leading-snug">
                {item.type === "employee" && item.data.name}
                {item.type === "task" && item.data.title}
                {item.type === "project" && item.data.name}
                {item.type === "department" && item.data.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 text-xs text-slate-700">
          {/* EMPLOYEE VIEW */}
          {item.type === "employee" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-600 mr-2">
                    {item.data.employeeId}
                  </span>
                  <span className="text-slate-600 font-medium">
                    {item.data.designation || "Staff"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.data.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.data.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                    {item.data.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Department
                  </span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.data.department?.name || "General"}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Work Location
                  </span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.data.workLocation || "Headquarters"}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Work Email</span>
                    <a
                      href={`mailto:${item.data.email}`}
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      {item.data.email}
                    </a>
                  </div>
                </div>

                {item.data.phone && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone Number</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {item.data.phone}
                      </span>
                    </div>
                  </div>
                )}

                {item.data.manager && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Reports To</span>
                      <span className="font-semibold text-slate-800">
                        {item.data.manager.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {item.data.skills && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Skills & Specializations
                  </span>
                  <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                    {item.data.skills}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TASK VIEW */}
          {item.type === "task" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-mono text-xs font-bold text-brand-600">
                  {item.data.taskId}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    {item.data.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Priority: {item.data.priority}
                  </span>
                </div>
              </div>

              {item.data.project && (
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                    Project
                  </span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.data.project.name}</span>
                  </p>
                </div>
              )}

              {item.data.assignedTo && (
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                    Assigned To
                  </span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.data.assignedTo.name}</span>
                  </p>
                </div>
              )}

              {item.data.description && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Description
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {item.data.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PROJECT VIEW */}
          {item.type === "project" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-800">
                  Client: {item.data.client || "Internal"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  {item.data.status}
                </span>
              </div>

              {item.data.description && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Description
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {item.data.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DEPARTMENT VIEW */}
          {item.type === "department" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-mono text-xs font-bold text-slate-700">
                  Code: {item.data.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                  {item.data._count?.users || 0} Members
                </span>
              </div>

              {item.data.description && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Overview
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                    {item.data.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
          >
            Close
          </button>

          {item.type === "employee" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(
                  userRole === "SUPER_ADMIN"
                    ? `/admin/employees?search=${encodeURIComponent(item.data.name)}`
                    : `/lead/team`
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Open in Employee Directory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {item.type === "task" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(userRole === "SUPER_ADMIN" ? `/admin/tasks` : `/tasks`);
              }}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Tasks Board</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {item.type === "project" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(userRole === "SUPER_ADMIN" ? `/admin/projects` : `/admin/projects`);
              }}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Projects Board</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {item.type === "department" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/admin/employees?departmentId=${item.data.id}`);
              }}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Filter Department in Directory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
