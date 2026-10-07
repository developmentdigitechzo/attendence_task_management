"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertCircle, Building2, Clock, Globe, Loader2 } from "lucide-react";
import { formatTime12h } from "@/lib/utils";
import { AntdCard, AntdFormItem, AntdInput, AntdSelect, AntdButton } from "@/components/ui/AntdUI";

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = useState("Digitechzo");
  const [subtitle, setSubtitle] = useState("Internal Employee Management & Productivity System");
  const [workStartTime, setWorkStartTime] = useState("10:00");
  const [workEndTime, setWorkEndTime] = useState("19:00");
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
        {/* Antd Branding Card */}
        <AntdCard
          title={
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Organization Branding</span>
            </span>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AntdFormItem label="Company Display Name" required>
              <AntdInput
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </AntdFormItem>

            <AntdFormItem label="Product Subtitle / Tagline">
              <AntdInput
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </AntdFormItem>
          </div>
        </AntdCard>

        {/* Antd Working Hours Card */}
        <AntdCard
          title={
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Office Hours & Attendance Calculation Rules</span>
            </span>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AntdFormItem
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Office Start Time</span>
                  <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                    {formatTime12h(workStartTime)}
                  </span>
                </span>
              }
            >
              <AntdInput
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="font-mono"
              />
            </AntdFormItem>

            <AntdFormItem
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Office End Time</span>
                  <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                    {formatTime12h(workEndTime)}
                  </span>
                </span>
              }
            >
              <AntdInput
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="font-mono"
              />
            </AntdFormItem>

            <AntdFormItem
              label="Grace Period (Minutes)"
              help={`Arrival after ${formatTime12h(workStartTime)} + ${gracePeriodMinutes}m is flagged as Late.`}
            >
              <AntdInput
                type="number"
                min="0"
                max="60"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
                className="font-mono"
              />
            </AntdFormItem>
          </div>
        </AntdCard>

        {/* Antd Timezone & Regional Card */}
        <AntdCard
          title={
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-600" />
              <span>Timezone & Regional Configuration</span>
            </span>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AntdFormItem label="Default Timezone">
              <AntdSelect
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="font-mono font-medium"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
              </AntdSelect>
            </AntdFormItem>

            <AntdFormItem
              label="Working Days (1=Mon ... 6=Sat, 7=Sun)"
              help="Comma-separated active working days of the week"
            >
              <AntdInput
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                placeholder="1,2,3,4,5,6"
                className="font-mono"
              />
            </AntdFormItem>
          </div>
        </AntdCard>

        <div className="flex justify-end">
          <AntdButton
            type="primary"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Save Company Settings
          </AntdButton>
        </div>
      </form>
    </div>
  );
}
