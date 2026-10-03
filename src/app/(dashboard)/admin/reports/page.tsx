"use client";

import { useState, useEffect } from "react";
import {
  FileBarChart2,
  Download,
  Printer,
  Filter,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getTodayDateString } from "@/lib/utils";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [startDate, setStartDate] = useState("2026-09-10");
  const [endDate, setEndDate] = useState("2026-09-16");
  const [month, setMonth] = useState("2026-09");
  const [departmentId, setDepartmentId] = useState("ALL");
  const [departments, setDepartments] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments || []))
      .catch(console.error);
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentId !== "ALL") params.set("departmentId", departmentId);

      let url = "";
      if (reportType === "weekly") {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
        url = `/api/reports/weekly?${params.toString()}`;
      } else {
        params.set("month", month);
        url = `/api/reports/monthly?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.report || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate, month, departmentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workforce Attendance & Hours Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamically calculated from verified check-in, check-out, and break timestamps
          </p>
        </div>

        {/* Export & Print actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <a
            href={`/api/reports/export?type=${reportType}&format=csv&month=${month}`}
            download
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </a>

          <a
            href={`/api/reports/export?type=${reportType}&format=excel&month=${month}`}
            download
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx) Export</span>
          </a>
        </div>
      </div>

      {/* Printable Header (Visible only in Print / PDF export) */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Digitechzo WorkOS</h2>
        <p className="text-xs text-slate-600">
          Official Attendance Report • {reportType === "weekly" ? `${startDate} to ${endDate}` : `Month: ${month}`}
        </p>
      </div>

      {/* Filter & Period Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden card-hover">
        {/* Toggle between Weekly and Monthly */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setReportType("weekly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === "weekly"
                ? "bg-white text-brand-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType("monthly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === "monthly"
                ? "bg-white text-brand-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Monthly Report
          </button>
        </div>

        {/* Date / Month Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {reportType === "weekly" ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
              />
            </div>
          )}

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none panel-hover">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between print:hidden">
          <h2 className="text-sm font-bold text-slate-900">
            {reportType === "weekly"
              ? `Weekly Breakdown (${startDate} to ${endDate})`
              : `Monthly Summary (${month})`}
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {reportData.length} employees calculated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold text-center">Working Days</th>
                <th className="py-3.5 px-4 font-semibold text-center text-emerald-600">Present</th>
                <th className="py-3.5 px-4 font-semibold text-center text-amber-600">Late Days</th>
                <th className="py-3.5 px-4 font-semibold text-center text-ink-600">Leaves</th>
                <th className="py-3.5 px-4 font-semibold text-center text-rose-600">Absent</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total Work Hours</th>
                <th className="py-3.5 px-4 font-semibold text-right">Avg / Day</th>
                {reportType === "monthly" && (
                  <th className="py-3.5 px-4 font-semibold text-right text-brand-600">Attendance %</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={reportType === "monthly" ? 10 : 9} className="py-12 text-center text-slate-400 font-sans">
                    Generating dynamic report from attendance database...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={reportType === "monthly" ? 10 : 9} className="py-12 text-center text-slate-400 font-sans">
                    No attendance records for selected criteria.
                  </td>
                </tr>
              ) : (
                reportData.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                      <div>
                        <p>{row.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{row.employeeId}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-600 font-medium">
                      {row.department}
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-700">
                      {row.workingDays}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {row.present}
                    </td>

                    <td className="py-3.5 px-4 text-center text-amber-700 font-medium">
                      {row.late}
                    </td>

                    <td className="py-3.5 px-4 text-center text-ink-700">
                      {row.leave}
                    </td>

                    <td className="py-3.5 px-4 text-center text-rose-600">
                      {row.absent}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {row.totalHoursFormatted}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {row.avgHoursFormatted}
                    </td>

                    {reportType === "monthly" && (
                      <td className="py-3.5 px-4 text-right font-bold text-brand-700">
                        {row.attendancePercentage}%
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
