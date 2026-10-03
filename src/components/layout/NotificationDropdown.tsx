"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, ExternalLink } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown({
  onClose,
  onRefreshCount,
}: {
  onClose: () => void;
  onRefreshCount: () => void;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onRefreshCount();
    } catch (e) {
      console.error(e);
    }
  };

  const markItemAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/20 sm:bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-[26rem] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
          <h3 className="font-semibold text-[15px] text-slate-900">Notifications</h3>
          <button
            onClick={markAllAsRead}
            className="text-[13px] text-brand-600 hover:text-brand-800 font-semibold transition"
          >
            Mark all as read
          </button>
        </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-5 py-3 text-[13px] transition flex gap-3 ${
                n.isRead ? "bg-white hover:bg-slate-50" : "bg-brand-50/40 hover:bg-brand-50/70"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-slate-800">{n.title}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-slate-600 text-[13px] leading-relaxed mb-1.5">{n.message}</p>
                {n.linkUrl && (
                  <Link
                    href={n.linkUrl}
                    onClick={() => {
                      markItemAsRead(n.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-800"
                  >
                    View details <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markItemAsRead(n.id)}
                  title="Mark as read"
                  className="shrink-0 p-1 text-slate-400 hover:text-brand-600"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
}
