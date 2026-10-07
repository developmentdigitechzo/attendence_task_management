"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  Users,
  CheckSquare,
  FolderGit2,
  Building,
  Building2,
  Home,
  X,
  Loader2,
  Play,
  Square,
} from "lucide-react";
import Link from "next/link";
import NotificationDropdown from "./NotificationDropdown";
import PushNotificationManager from "./PushNotificationManager";
import { toast, useIsMutating } from "@/components/ui/ToastProvider";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import SearchDetailModal, { SearchDetailItem } from "./SearchDetailModal";
import CheckInModal from "@/components/attendance/CheckInModal";
import { isMonthlyBackupDay } from "@/lib/chatRetentionConstants";

interface TopbarProps {
  user: {
    id: string;
    name: string;
    role: string;
  };
  onMenuClick?: () => void;
}

export default function Topbar({ user, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const isMutating = useIsMutating();
  const [timeString, setTimeString] = useState<string>("");
  const [liveStatus, setLiveStatus] = useState<"WORKING" | "ON_BREAK" | "OFFLINE">(
    user.role === "SUPER_ADMIN" ? "WORKING" : "OFFLINE"
  );
  const [workType, setWorkType] = useState<"Work from Home" | "Office" | null>(
    user.role === "SUPER_ADMIN" ? "Office" : null
  );
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const seenIds = useRef<Set<string> | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    employees: any[];
    tasks: any[];
    projects: any[];
    departments: any[];
  } | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<SearchDetailItem | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    setSearchLoading(true);
    setIsSearchOpen(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside search
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  // Click outside notifications
  useEffect(() => {
    if (!isNotifOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotifOpen]);

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
        } else if (user.role === "SUPER_ADMIN") {
          // Admin role login is always Working
          setLiveStatus("WORKING");
        } else {
          setLiveStatus("OFFLINE");
        }

        if (data.workType) {
          setWorkType(data.workType);
        } else if (data.attendance?.notes?.includes("Work from Home")) {
          setWorkType("Work from Home");
        } else if (user.role === "SUPER_ADMIN" || data.attendance?.checkIn) {
          setWorkType("Office");
        } else {
          setWorkType(null);
        }
      }

      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadCount(notifData.unreadCount || 0);

        // Toast any unread notifications that arrived since the last poll
        const list: any[] = notifData.notifications || [];
        if (seenIds.current === null) {
          seenIds.current = new Set(list.map((n) => n.id)); // first load: don't spam
        } else {
          for (const n of list.slice().reverse()) {
            if (!seenIds.current.has(n.id)) {
              seenIds.current.add(n.id);
              if (!n.isRead) {
                toast.notification(n.message, { title: n.title, href: n.linkUrl || undefined, duration: 6000 });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatusAndNotifs();

    // Check if today is the 30th day of the month for the chat backup toast
    try {
      const now = new Date();
      if (isMonthlyBackupDay(now)) {
        const topbarToastKey = `chat_backup_topbar_toast_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
        if (localStorage.getItem(topbarToastKey) !== "true") {
          localStorage.setItem(topbarToastKey, "true");
          toast.notification(
            "Today is the 30th! Reminder: Internal chat messages older than 100 days are automatically erased. Click to backup your chat.",
            {
              title: "Monthly Chat Backup Reminder (Day 30)",
              href: "/chat",
              duration: 12000,
            }
          );
        }
      }
    } catch (e) {
      console.error(e);
    }

    const interval = setInterval(fetchStatusAndNotifs, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const handleCheckInSuccess = (data: any) => {
    const chosenWorkType = data.workType === "Work from Home" ? "Work from Home" : "Office";
    setWorkType(chosenWorkType);
    setLiveStatus("WORKING");
    toast.success(
      `Check-in successful (${chosenWorkType} - ${data.attendance?.status || "PRESENT"})!`
    );
    fetchStatusAndNotifs();
  };

  const handleQuickCheckOut = async () => {
    const ok = await confirmAction({
      title: "Confirm Check Out",
      message: "Are you sure you want to end your workday and check out?",
      confirmText: "Check Out",
      variant: "danger",
    });
    if (!ok) return;

    setQuickActionLoading(true);
    try {
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Check-out failed");
      } else {
        toast.success("Checked out successfully for the day!");
        setLiveStatus("OFFLINE");
        setWorkType(null);
        fetchStatusAndNotifs();
      }
    } catch {
      toast.error("Network error checking out");
    } finally {
      setQuickActionLoading(false);
    }
  };

  return (
    <header className="h-16 sm:h-[72px] bg-white/90 backdrop-blur border-b border-slate-200 border-t-4 border-t-brand-500 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-sm">
      {/* Left: Mobile Hamburger & Brand Mark, plus Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
        {/* Mobile hamburger menu toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile logo emblem */}
        <div className="hidden sm:flex lg:hidden items-center shrink-0 mr-1">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-xs ring-1 ring-brand-500/40">
            <Image
              src="/digitechzo-mark.png"
              alt="Digitechzo"
              width={56}
              height={32}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full min-w-0" ref={searchRef}>
          <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-400 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && searchResults) {
                setIsSearchOpen(true);
              }
            }}
            placeholder="Search..."
            className="w-full pl-8 sm:pl-10 pr-7 sm:pr-9 py-1.5 sm:py-2.5 text-xs sm:text-[13.5px] text-slate-800 placeholder:text-slate-400 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition truncate"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full mt-2 bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200 py-3 z-50 max-h-[75vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 ease-out origin-top">
              {searchLoading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  <span>Searching WorkOS...</span>
                </div>
              ) : !searchResults || (
                searchResults.employees.length === 0 &&
                searchResults.tasks.length === 0 &&
                searchResults.projects.length === 0 &&
                searchResults.departments.length === 0
              ) ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  No matches found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-slate-100">
                  {/* Employees Group */}
                  {searchResults.employees.length > 0 && (
                    <div className="px-3 pt-1">
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-slate-500" />
                        Employees ({searchResults.employees.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.employees.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSelectedDetailItem({ type: "employee", data: emp });
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                {emp.name[0]}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-700 transition truncate">
                                  {emp.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {emp.employeeId} • {emp.designation || emp.role} • {emp.department?.name || "General"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 group-hover:text-brand-600 transition shrink-0 ml-2">
                              View →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Group */}
                  {searchResults.tasks.length > 0 && (
                    <div className="px-3 pt-2">
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-slate-500" />
                        Tasks ({searchResults.tasks.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.tasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSelectedDetailItem({ type: "task", data: task });
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-700 transition truncate">
                                {task.title}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {task.taskId} • {task.project?.name || "Independent"}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0 ml-2">
                              {task.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Group */}
                  {searchResults.projects.length > 0 && (
                    <div className="px-3 pt-2">
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FolderGit2 className="w-3 h-3 text-slate-500" />
                        Projects ({searchResults.projects.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.projects.map((proj) => (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSelectedDetailItem({ type: "project", data: proj });
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-700 transition truncate">
                                {proj.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                Client: {proj.client || "Internal"}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 shrink-0 ml-2">
                              {proj.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Departments Group */}
                  {searchResults.departments.length > 0 && (
                    <div className="px-3 pt-2">
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-500" />
                        Departments ({searchResults.departments.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.departments.map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSelectedDetailItem({ type: "department", data: dept });
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-700 transition truncate">
                                {dept.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                Code: {dept.code}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 group-hover:text-brand-600 transition shrink-0 ml-2">
                              View →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Clock, Status, Chat, Notifications */}
      <div className="flex items-center gap-1 sm:gap-2.5 lg:gap-3.5 shrink-0">
        {/* Global Action Loading Indicator in Top Right Header */}
        {isMutating && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-brand-50 border border-brand-200 text-brand-700 shadow-xs animate-in fade-in zoom-in-95 duration-150 shrink-0"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 shrink-0" />
            <span className="hidden sm:inline">Saving...</span>
          </div>
        )}

        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 text-[13px] font-semibold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-brand-600" />
          <span className="tabular-nums">{timeString || "Loading..."}</span>
        </div>

        {/* Live Status & Quick Punch Controls for Lead & Employee */}
        {user.role === "SUPER_ADMIN" ? (
          <>
            {liveStatus === "ON_BREAK" ? (
              <span className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="hidden sm:inline">On Break</span>
              </span>
            ) : (
              <span
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
                  workType === "Work from Home"
                    ? "text-indigo-900 bg-indigo-50 border-indigo-200"
                    : "text-brand-800 bg-brand-50 border-brand-200"
                }`}
                title={workType === "Work from Home" ? "Checked in: Work from Home" : "Checked in: Office"}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    workType === "Work from Home" ? "bg-indigo-500" : "bg-brand-500"
                  }`}
                />
                {workType === "Work from Home" ? (
                  <Home className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                )}
                <span className="hidden sm:inline">Working</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded hidden sm:inline ${
                    workType === "Work from Home"
                      ? "text-indigo-700 bg-indigo-100"
                      : "text-brand-700 bg-brand-100"
                  }`}
                >
                  {workType === "Work from Home" ? "Home" : "Office"}
                </span>
              </span>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {liveStatus === "OFFLINE" && (
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(true)}
                disabled={quickActionLoading}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition active:scale-95 disabled:opacity-50 shrink-0"
                title="Punch In for Today"
              >
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white shrink-0" />
                <span className="hidden xs:inline">Punch In</span>
                <span className="xs:hidden">In</span>
              </button>
            )}

            {liveStatus === "WORKING" && (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                    workType === "Work from Home"
                      ? "text-indigo-900 bg-indigo-50 border-indigo-200"
                      : "text-brand-800 bg-brand-50 border-brand-200"
                  }`}
                  title={workType === "Work from Home" ? "Checked in: Work from Home" : "Checked in: Office"}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      workType === "Work from Home" ? "bg-indigo-500" : "bg-brand-500"
                    }`}
                  />
                  <span className="hidden md:inline">Working</span>
                  <span
                    className={`text-[10px] font-bold px-1 py-0.2 rounded hidden sm:inline ${
                      workType === "Work from Home"
                        ? "text-indigo-700 bg-indigo-100"
                        : "text-brand-700 bg-brand-100"
                    }`}
                  >
                    {workType === "Work from Home" ? "Home" : "Office"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleQuickCheckOut}
                  disabled={quickActionLoading}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 disabled:opacity-50 shrink-0"
                  title="Punch Out for the Day"
                >
                  <Square className="w-3 h-3 fill-rose-600 text-rose-600 shrink-0" />
                  <span className="hidden xs:inline">{quickActionLoading ? "..." : "Punch Out"}</span>
                  <span className="xs:hidden">{quickActionLoading ? "..." : "Out"}</span>
                </button>
              </div>
            )}

            {liveStatus === "ON_BREAK" && (
              <span className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="hidden xs:inline">On Break</span>
                <span className="xs:hidden">Break</span>
              </span>
            )}
          </div>
        )}

        <span className="hidden sm:block w-px h-7 bg-slate-200" aria-hidden="true" />

        {/* Chat Shortcut */}
        <Link
          href="/chat"
          className="relative p-1.5 sm:p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition shrink-0"
          title="Team Chat"
          aria-label="Team Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </Link>

        <div className="hidden sm:block shrink-0">
          <PushNotificationManager />
        </div>

        {/* Notification Bell */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-1.5 sm:p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
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

      {/* Global Search Result Detail Modal */}
      <SearchDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        userRole={user.role}
      />

      {/* Daily Check-In Work Type Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSuccess={handleCheckInSuccess}
        userRole={user.role}
      />
    </header>
  );
}
