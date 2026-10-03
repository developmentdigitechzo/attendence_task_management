"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertCircle, Building2, Clock, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = useState("Digitechzo");
  const [subtitle, setSubtitle] = useState("Internal Employee Management & Productivity System");
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [workingDays, setWorkingDays] = useState("1,2,3,4,5,6");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          if (s.companyName) setCompanyName(s.companyName);
          if (s.subtitle) setSubtitle(s.subtitle);
          if (s.workStartTime) setWorkStartTime(s.workStartTime);
          if (s.workEndTime) setWorkEndTime(s.workEndTime);
          if (s.gracePeriodMinutes) setGracePeriodMinutes(parseInt(s.gracePeriodMinutes, 10));
          if (s.timezone) setTimezone(s.timezone);
          if (s.workingDays) setWorkingDays(s.workingDays);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          subtitle,
          workStartTime,
          workEndTime,
          gracePeriodMinutes,
          timezone,
          workingDays,
        }),
      });

      if (res.ok) {
        setMessage("Company settings updated successfully.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage("Network error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Company & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure organization branding, default working hours, grace period policies and timezone
        </p>
      </div>


      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Organization Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Display Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Subtitle / Tagline
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Working Hours & Grace Period Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Office Hours & Attendance Calculation Rules</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Office Start Time
              </label>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Office End Time
              </label>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Arrival after {workStartTime} + {gracePeriodMinutes}m is flagged as Late.
              </p>
            </div>
          </div>
        </div>

        {/* Timezone & Localization */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 panel-hover">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" />
            <span>Timezone & Regional Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-mono font-medium"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Working Days (1=Mon ... 6=Sat, 7=Sun)
              </label>
              <input
                type="text"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                placeholder="1,2,3,4,5,6"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Comma-separated active working days of the week</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Company Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
