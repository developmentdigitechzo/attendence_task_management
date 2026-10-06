"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, Save, Plus, Check } from "lucide-react";
import { formatWorkingHours } from "@/lib/utils";

interface EmployeeModalProps {
  employee?: any | null; // if provided, edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeModal({
  employee,
  onClose,
  onSuccess,
}: EmployeeModalProps) {
  const isEdit = Boolean(employee);
  const [name, setName] = useState(employee?.name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [departmentId, setDepartmentId] = useState(employee?.departmentId || "");
  const [designation, setDesignation] = useState(employee?.designation || "");
  const [role, setRole] = useState(employee?.role || "EMPLOYEE");
  const [managerId, setManagerId] = useState(employee?.managerId || "");
  const [workLocation, setWorkLocation] = useState(employee?.workLocation || "Headquarters");
  const [workingHours, setWorkingHours] = useState(employee?.workingHours ? formatWorkingHours(employee.workingHours) : "10:00 AM - 07:00 PM");
  const [password, setPassword] = useState("password123");
  const [status, setStatus] = useState(employee?.status || "ACTIVE");

  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick add department states
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);
  const [deptSuccessMsg, setDeptSuccessMsg] = useState<string | null>(null);

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    setCreatingDept(true);
    setError(null);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add department.");
      } else {
        setDepartments((prev) => [...prev, data.department]);
        setDepartmentId(data.department.id);
        setNewDeptName("");
        setNewDeptCode("");
        setShowAddDept(false);
        setDeptSuccessMsg(`Department "${data.department.name}" added!`);
        setTimeout(() => setDeptSuccessMsg(null), 3500);
      }
    } catch {
      setError("Network error adding department.");
    } finally {
      setCreatingDept(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/employees?role=MANAGER").then((r) => r.json()),
    ])
      .then(([deptData, mgrData]) => {
        setDepartments(deptData.departments || []);
        setManagers(mgrData.employees || []);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!isEdit && !email.trim())) {
      setError("Name and Email are required.");
      return;
    }

    if (phone && phone.trim().length > 0 && phone.trim().length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const url = "/api/employees";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit
        ? {
            id: employee.id,
            name,
            phone,
            departmentId: departmentId || null,
            designation,
            role,
            managerId: managerId || null,
            workLocation,
            workingHours,
            status,
          }
        : {
            name,
            email,
            phone,
            departmentId: departmentId || null,
            designation,
            role,
            managerId: managerId || null,
            workLocation,
            workingHours,
            password,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save employee.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Network error saving employee.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              {isEdit ? "Edit Employee Profile" : "Onboard New Employee"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `Updating records for ${employee.employeeId}`
                : "Creates account with auto-generated Employee ID"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Mehta"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                disabled={isEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@digitechzo.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddDept((v) => !v)}
                  title="Add new department"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddDept ? "Close" : "New"}</span>
                </button>
              </div>

              {showAddDept && (
                <div className="p-2.5 bg-brand-50/70 border border-brand-200 rounded-xl space-y-2 mb-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-900">
                      Add New Department
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddDept(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="Department Name (e.g. QA)"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-brand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                        placeholder="Code (optional)"
                        className="w-28 px-2.5 py-1.5 text-xs bg-white border border-brand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateDepartment()}
                        disabled={creatingDept || !newDeptName.trim()}
                        className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition"
                      >
                        {creatingDept ? "Adding..." : "Add Department"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {deptSuccessMsg && (
                <p className="text-[11px] text-emerald-600 font-medium mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{deptSuccessMsg}</span>
                </p>
              )}

              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation / Job Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role & Access
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reporting Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              >
                <option value="">No Manager (Direct)</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <span className="text-[10px] text-slate-400">
                  {phone ? `${phone.length}/10 digits` : "10 digits"}
                </span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(cleaned);
                }}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Location
              </label>
              <input
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="Headquarters (Desk 12)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Working Hours
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="10:00 AM - 07:00 PM"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
            />
          </div>

          {isEdit ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-semibold text-slate-800"
              >
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Temporary Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Employee will be prompted to change upon first login.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isEdit ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{submitting ? "Saving..." : isEdit ? "Save Changes" : "Onboard Employee"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
