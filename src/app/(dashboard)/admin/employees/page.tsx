"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  Edit2,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import EmployeeModal from "@/components/employees/EmployeeModal";
import { formatDateDisplay } from "@/lib/utils";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/ToastProvider";
import { AntdButton, AntdInput, AntdSelect } from "@/components/ui/AntdUI";

export default function AdminEmployeesPage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlDept = searchParams.get("departmentId") || "ALL";

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState(urlSearch);
  const [departmentFilter, setDepartmentFilter] = useState(urlDept);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Sync state if URL query params change
  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) setSearch(q);
    const d = searchParams.get("departmentId");
    if (d !== null) setDepartmentFilter(d);
  }, [searchParams]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (departmentFilter !== "ALL") params.set("departmentId", departmentFilter);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, departmentFilter, roleFilter, statusFilter]);

  const handleToggleStatus = async (emp: any) => {
    const newStatus = emp.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    const isDeactivate = newStatus === "DEACTIVATED";
    const ok = await confirmAction({
      title: isDeactivate ? "Deactivate Employee" : "Activate Employee",
      message: `Are you sure you want to ${isDeactivate ? "deactivate" : "activate"} ${emp.name}? ${
        isDeactivate ? "They will not be able to log in while deactivated." : "They will regain system access."
      }`,
      confirmText: isDeactivate ? "Deactivate" : "Activate",
      variant: isDeactivate ? "danger" : "default",
    });
    // Optimistic status update
    const previousEmployees = [...employees];
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e))
    );
    toast.success(`${emp.name} account ${newStatus === "DEACTIVATED" ? "deactivated" : "reactivated"}.`);

    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-skip-toast": "1" },
        body: JSON.stringify({ id: emp.id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
    } catch {
      setEmployees(previousEmployees);
      toast.error("Could not update employee status. Reverted.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Employee Directory & Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company staff profiles, roles, and access controls
          </p>
        </div>

        <AntdButton
          type="primary"
          icon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={() => {
            setEditingEmployee(null);
            setIsModalOpen(true);
          }}
          className="!h-9"
        >
          Onboard New Employee
        </AntdButton>
      </div>

      {/* Filter Bar (Antd Card style) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="flex-1 min-w-[200px]">
          <AntdInput
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, employee ID, designation..."
            prefix={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="min-w-[140px]">
          <AntdSelect
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </AntdSelect>
        </div>

        <div className="min-w-[120px]">
          <AntdSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </AntdSelect>
        </div>

        <div className="min-w-[120px]">
          <AntdSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DEACTIVATED">Deactivated</option>
          </AntdSelect>
        </div>
      </div>

      {/* Employee Table (Antd Card style) */}
      <div className="bg-white rounded-lg border border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto pb-1">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Contact</th>
                <th className="py-3.5 px-4 font-semibold">Joined</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={`emp-skel-${i}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 skeleton-shimmer shrink-0" />
                        <div className="space-y-1.5 min-w-0">
                          <div className="w-28 h-3.5 bg-slate-200 rounded skeleton-shimmer" />
                          <div className="w-20 h-2.5 bg-slate-100 rounded skeleton-shimmer" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3.5 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded-full skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-3.5 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3.5 bg-slate-200 rounded skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded-full skeleton-shimmer" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-12 h-6 bg-slate-200 rounded-lg ml-auto skeleton-shimmer" /></td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-ink-500 text-white font-semibold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {emp.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono text-brand-600 font-semibold mr-1.5">
                              {emp.employeeId}
                            </span>
                            • {emp.designation || "Staff"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {emp.department?.name || "General Operations"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          emp.role === "SUPER_ADMIN"
                            ? "bg-ink-50 text-ink-700 border border-ink-200"
                            : emp.role === "MANAGER"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {emp.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{emp.email}</span>
                      </p>
                      {emp.phone && (
                        <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emp.phone}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateDisplay(emp.joiningDate)}
                    </td>

                    <td className="py-3.5 px-4">
                      {emp.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`p-1.5 rounded-lg transition ${
                            emp.status === "ACTIVE"
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={emp.status === "ACTIVE" ? "Deactivate Account" : "Reactivate Account"}
                        >
                          {emp.status === "ACTIVE" ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
}
