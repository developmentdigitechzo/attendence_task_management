"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, Clock, User, HardDrive } from "lucide-react";
import { formatTimeIST, formatDateDisplay } from "@/lib/utils";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Compliance & Security Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system logs of administrative actions, attendance corrections, and approvals
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit actions..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden panel-hover">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Audit Event Log</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Actor / User</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Type</th>
                <th className="py-3 px-4 font-semibold">Operational Details</th>
                <th className="py-3 px-4 font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateDisplay(log.createdAt)} {formatTimeIST(log.createdAt)}
                    </td>

                    <td className="py-3 px-4 font-sans font-bold text-slate-800">
                      {log.userName || "System"}
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-brand-100">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-sans font-medium">
                      {log.targetType}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600 max-w-md truncate" title={log.details}>
                      {log.details || "—"}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
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
