"use client";

import { Eye, EyeOff, ShieldAlert, Bell, MessageSquare, CheckCircle2 } from "lucide-react";

export type PushVisibilityMode = "VISIBLE" | "HIDE_MESSAGE" | "HIDDEN";

interface PushPrivacyCardProps {
  value: PushVisibilityMode;
  onChange: (mode: PushVisibilityMode) => void;
  disabled?: boolean;
}

export default function PushPrivacyCard({
  value,
  onChange,
  disabled = false,
}: PushPrivacyCardProps) {
  const options: {
    id: PushVisibilityMode;
    title: string;
    description: string;
    icon: any;
    color: string;
    previewTitle: string;
    previewBody: string;
    exampleLabel: string;
  }[] = [
    {
      id: "VISIBLE",
      title: "Visible (Show Message & Sender)",
      description: "Shows sender name and the full message text in push notifications.",
      icon: Eye,
      color: "brand",
      previewTitle: "Message from John",
      previewBody: "hiii",
      exampleLabel: "Full preview: shows 'Message from John' & 'hiii'",
    },
    {
      id: "HIDE_MESSAGE",
      title: "Hide Message (Show Sender Only)",
      description: "Shows who sent the message but hides the message text for lockscreen privacy.",
      icon: EyeOff,
      color: "amber",
      previewTitle: "Message from John",
      previewBody: "New message received (preview hidden)",
      exampleLabel: "Privacy mode: shows 'Message from John' & hides 'hiii'",
    },
    {
      id: "HIDDEN",
      title: "Hide All (Strict Privacy)",
      description: "Hides both the sender name and message content on notifications.",
      icon: ShieldAlert,
      color: "slate",
      previewTitle: "Digitechzo WorkOS",
      previewBody: "New notification received",
      exampleLabel: "Strict privacy: hides sender name & message content",
    },
  ];

  const currentOption = options.find((o) => o.id === value) || options[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 panel-hover">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Push Messages Privacy & Visibility
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose whether push alerts reveal incoming message content or keep them private.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 w-fit">
          <MessageSquare className="w-3 h-3 text-slate-500" />
          <span>Lockscreen & Desktop Alerts</span>
        </span>
      </div>

      {/* Radio options grid */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          const Icon = opt.icon;

          return (
            <label
              key={opt.id}
              className={`flex items-start gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                isSelected
                  ? "border-brand-600 bg-brand-50/40 shadow-sm shadow-brand-500/5"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                name="pushMessageVisibility"
                value={opt.id}
                checked={isSelected}
                onChange={() => onChange(opt.id)}
                className="sr-only"
              />

              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {opt.title}
                  </p>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-brand-600 bg-brand-600"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {opt.description}
                </p>
                <p className="text-[10px] font-medium text-brand-700 mt-1">
                  👉 {opt.exampleLabel}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Live Simulated Push Notification Box */}
      <div className="pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <span>Live Notification Preview on Your Device:</span>
        </p>

        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ring-2 ring-slate-800">
              J
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Digitechzo WorkOS • Push</span>
                <span>Just now</span>
              </div>
              <p className="text-xs font-bold text-white mt-1">
                {currentOption.previewTitle}
              </p>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {currentOption.previewBody}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tap to open chat conversation in WorkOS</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active Setting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
