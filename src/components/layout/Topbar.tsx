"use client";

import { useState, useEffect } from "react";
import { Bell, Search, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import NotificationDropdown from "./NotificationDropdown";

interface TopbarProps {
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  const [timeString, setTimeString] = useState<string>("");
  const [liveStatus, setLiveStatus] = useState<"WORKING" | "ON_BREAK" | "OFFLINE">("OFFLINE");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    // Update live clock every second
    const updateTime = () => {
      const now = new Date();
      const str = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStr = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setTimeString(`${dateStr} • ${str}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll today's status & notifications
  const fetchStatusAndNotifs = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const data = await res.json();
        if (data.activeBreak) {
          setLiveStatus("ON_BREAK");
        } else if (data.attendance?.checkIn && !data.attendance?.checkOut) {
          setLiveStatus("WORKING");
        } else {
          setLiveStatus("OFFLINE");
        }
      }

      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatusAndNotifs();
    const interval = setInterval(fetchStatusAndNotifs, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[72px] bg-white/90 backdrop-blur border-b border-slate-200 border-t-4 border-t-brand-500 px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      {/* Search / Context */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-[18px] h-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees, tasks, projects (Ctrl+K)..."
            className="w-full pl-11 pr-4 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition"
          />
        </div>
      </div>

      {/* Right Controls: Clock, Status, Chat, Notifications */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 text-[13px] font-semibold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-brand-600" />
          <span className="tabular-nums">{timeString || "Loading..."}</span>
        </div>

        {/* Live Status Pill */}
        {liveStatus === "WORKING" && (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold text-brand-800 bg-brand-50 border border-brand-200">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Working
          </span>
        )}
        {liveStatus === "ON_BREAK" && (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold text-amber-800 bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            On Break
          </span>
        )}
        {liveStatus === "OFFLINE" && (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Offline
          </span>
        )}

        <span className="hidden sm:block w-px h-7 bg-slate-200" aria-hidden="true" />

        {/* Chat Shortcut */}
        <Link
          href="/chat"
          className="relative p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition"
          title="Team Chat"
          aria-label="Team Chat"
        >
          <MessageSquare className="w-[18px] h-[18px]" />
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <NotificationDropdown
              onClose={() => setIsNotifOpen(false)}
              onRefreshCount={() => setUnreadCount(0)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
