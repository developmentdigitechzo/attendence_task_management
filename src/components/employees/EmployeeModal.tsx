"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, Save, Plus, Check } from "lucide-react";
import { formatWorkingHours } from "@/lib/utils";
import { AntdFormItem, AntdInput, AntdSelect, AntdButton } from "@/components/ui/AntdUI";

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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 ease-out">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)] border border-[#f0f0f0] animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] flex flex-col">
        {/* Antd Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <div>
            <h3 className="font-semibold text-base text-slate-800 leading-snug">
              {isEdit ? "Edit Employee Profile" : "Onboard New Employee"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit
                ? `Updating records for ${employee.employeeId}`
                : "Creates account with auto-generated Employee ID"}
            </p>
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

          <form id="employee-form" onSubmit={handleSubmit} className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <AntdFormItem label="Full Name" required>
                <AntdInput
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Mehta"
                />
              </AntdFormItem>
              <AntdFormItem label="Email Address" required>
                <AntdInput
                  type="email"
                  required
                  disabled={isEdit}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@digitechzo.com"
                />
              </AntdFormItem>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-normal text-slate-700 leading-tight">
                    Department
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddDept((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 px-1.5 py-0.5 rounded border border-brand-200 hover:bg-brand-50 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddDept ? "Cancel" : "New Dept"}</span>
                  </button>
                </div>

                {showAddDept && (
                  <div className="p-3 bg-slate-50 border border-[#e5e7eb] rounded-md space-y-2 mb-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Quick Add Department
                    </span>
                    <AntdInput
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="Department Name (e.g. QA)"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <AntdInput
                        type="text"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                        placeholder="Code (optional)"
                        className="w-28 uppercase"
                      />
                      <AntdButton
                        type="primary"
                        onClick={() => handleCreateDepartment()}
                        loading={creatingDept}
                        disabled={!newDeptName.trim()}
                        className="flex-1 !h-9 text-xs"
                      >
                        Add
                      </AntdButton>
                    </div>
                  </div>
                )}

                {deptSuccessMsg && (
                  <p className="text-[11px] text-emerald-600 font-medium mb-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{deptSuccessMsg}</span>
                  </p>
                )}

                <AntdFormItem className="mb-4">
                  <AntdSelect
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </AntdSelect>
                </AntdFormItem>
              </div>

              <AntdFormItem label="Designation / Job Title">
                <AntdInput
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                />
              </AntdFormItem>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <AntdFormItem label="Role & Access">
                <AntdSelect
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </AntdSelect>
              </AntdFormItem>

              <AntdFormItem label="Reporting Manager">
                <AntdSelect
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                >
                  <option value="">No Manager (Direct)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.designation})
                    </option>
                  ))}
                </AntdSelect>
              </AntdFormItem>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <AntdFormItem
                label="Phone Number"
                help={phone ? `${phone.length}/10 digits` : "10 digits"}
              >
                <AntdInput
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(cleaned);
                  }}
                  placeholder="9876543210"
                  className="font-mono"
                />
              </AntdFormItem>

              <AntdFormItem label="Work Location">
                <AntdInput
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="Headquarters (Desk 12)"
                />
              </AntdFormItem>
            </div>

            <AntdFormItem label="Working Hours">
              <AntdInput
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="10:00 AM - 07:00 PM"
              />
            </AntdFormItem>

            {isEdit ? (
              <AntdFormItem label="Employment Status">
                <AntdSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="font-medium text-slate-800"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVATED">Deactivated</option>
                  <option value="ARCHIVED">Archived</option>
                </AntdSelect>
              </AntdFormItem>
            ) : (
              <AntdFormItem
                label="Temporary Password"
                help="Employee will be prompted to change upon first login."
              >
                <AntdInput
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                />
              </AntdFormItem>
            )}
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
            icon={isEdit ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            onClick={(e) => {
              const form = document.getElementById("employee-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            {isEdit ? "Save Changes" : "Onboard Employee"}
          </AntdButton>
        </div>
      </div>
    </div>
  );
}
