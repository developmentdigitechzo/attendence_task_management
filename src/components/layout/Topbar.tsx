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
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import NotificationDropdown from "./NotificationDropdown";
import PushNotificationManager from "./PushNotificationManager";
import { toast } from "@/components/ui/ToastProvider";
import SearchDetailModal, { SearchDetailItem } from "./SearchDetailModal";

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
  const [timeString, setTimeString] = useState<string>("");
  const [liveStatus, setLiveStatus] = useState<"WORKING" | "ON_BREAK" | "OFFLINE">("OFFLINE");
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
        } else {
          setLiveStatus("OFFLINE");
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
    const interval = setInterval(fetchStatusAndNotifs, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

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
        <div className="lg:hidden flex items-center shrink-0 mr-1">
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
          <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && searchResults) {
                setIsSearchOpen(true);
              }
            }}
            placeholder="Search employees, tasks, projects..."
            className="w-full pl-9 sm:pl-11 pr-8 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-[13.5px] text-slate-800 placeholder:text-slate-400 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition truncate"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200 py-3 z-50 max-h-[75vh] overflow-y-auto animate-in fade-in duration-100">
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
      <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 text-[13px] font-semibold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-brand-600" />
          <span className="tabular-nums">{timeString || "Loading..."}</span>
        </div>

        {/* Live Status Pill */}
        {liveStatus === "WORKING" && (
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-brand-800 bg-brand-50 border border-brand-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            <span className="hidden sm:inline">Working</span>
          </span>
        )}
        {liveStatus === "ON_BREAK" && (
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="hidden sm:inline">On Break</span>
          </span>
        )}
        {liveStatus === "OFFLINE" && (
          <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Offline
          </span>
        )}

        <span className="hidden sm:block w-px h-7 bg-slate-200" aria-hidden="true" />

        {/* Chat Shortcut */}
        <Link
          href="/chat"
          className="relative p-2 sm:p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition"
          title="Team Chat"
          aria-label="Team Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </Link>

        <PushNotificationManager />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 sm:p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition"
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
    </header>
  );
}
