"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  FolderGit2,
  MessageSquare,
  CalendarDays,
  Calendar,
  Bell,
  FileBarChart2,
  ShieldCheck,
  Settings,
  LogOut,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    designation?: string;
    avatarUrl?: string;
    employeeId: string;
  };
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isTeamLead = user.role === "MANAGER";
  const [chatMessageCount, setChatMessageCount] = useState<number>(0);

  useEffect(() => {
    const fetchChatCount = async () => {
      try {
        const res = await fetch("/api/chat/count");
        if (res.ok) {
          const data = await res.json();
          setChatMessageCount(data.totalMessages || 0);
        }
      } catch {
        // silent fail
      }
    };

    fetchChatCount();
    const interval = setInterval(fetchChatCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminNav = [
    { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Staff Directory", href: "/admin/employees", icon: Users },
    { name: "Attendance Roster", href: "/admin/attendance", icon: Clock },
    { name: "Tasks & Roadmaps", href: "/admin/tasks", icon: CheckSquare },
    { name: "Projects & Milestones", href: "/admin/projects", icon: FolderGit2 },
    { name: "Internal Chat", href: "/chat", icon: MessageSquare },
    { name: "Leave Approvals", href: "/admin/leave", icon: CalendarDays },
    { name: "Announcements", href: "/admin/announcements", icon: Bell },
    { name: "Reports & Export", href: "/admin/reports", icon: FileBarChart2 },
    { name: "Company Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "Audit Trail", href: "/admin/audit", icon: ShieldCheck },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  const leadNav = [
    { name: "Team Command Center", href: "/lead", icon: LayoutDashboard },
    { name: "Team Workload & Capacity", href: "/lead/team", icon: Users },
    { name: "Tasks & Review Queue", href: "/lead/tasks", icon: CheckSquare },
    { name: "Projects & Milestones", href: "/lead/projects", icon: FolderGit2 },
    { name: "Team Live Attendance", href: "/lead/attendance", icon: Clock },
    { name: "Team Leave Approvals", href: "/lead/leave", icon: CalendarDays },
    { name: "Daily Standups (EOD)", href: "/lead/standup", icon: MessageSquare },
    { name: "Team Calendar", href: "/lead/calendar", icon: Calendar },
    { name: "Internal Chat", href: "/chat", icon: MessageSquare },
    { name: "My Profile", href: "/lead/profile", icon: UserCheck },
  ];

  const employeeNav = [
    { name: "Dashboard (My Day)", href: "/employee", icon: LayoutDashboard },
    { name: "My Attendance", href: "/employee/attendance", icon: Clock },
    { name: "My Tasks", href: "/employee/tasks", icon: CheckSquare },
    { name: "Internal Chat", href: "/chat", icon: MessageSquare },
    { name: "Leave Requests", href: "/employee/leave", icon: CalendarDays },
    { name: "Calendar", href: "/employee/calendar", icon: Calendar },
    { name: "My Profile", href: "/employee/profile", icon: UserCheck },
  ];

  const navItems = isSuperAdmin ? adminNav : isTeamLead ? leadNav : employeeNav;
  const navSectionTitle = isSuperAdmin
    ? "Admin Portal"
    : isTeamLead
    ? "Team Lead Portal"
    : "Employee Portal";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const targetLogin = isSuperAdmin
        ? "/admin/login"
        : isTeamLead
        ? "/lead/login"
        : "/employee/login";
      router.push(targetLogin);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel =
    user.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user.role === "MANAGER"
      ? "Manager"
      : user.designation || "Employee";

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-72 max-w-[85vw] fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 lg:z-auto bg-slate-950 text-slate-100 flex flex-col shrink-0 select-none h-[100dvh] border-r border-white/5 bg-[radial-gradient(28rem_18rem_at_0%_0%,rgba(92,181,40,0.14),transparent_70%)] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-black/50 ring-2 ring-brand-500/50 shrink-0">
              <Image
                src="/digitechzo-mark.png"
                alt="Digitechzo"
                width={216}
                height={126}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                Digi<span className="text-brand-400">tech</span>zo
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] bg-brand-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-md font-sans">
                  WorkOS
                </span>
                <p className="text-[11px] text-slate-400 truncate">Nifty-Model Work OS</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-2 mb-3 flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-brand-300">
              {navSectionTitle}
            </span>
            <span className="text-[10px] font-semibold bg-white/5 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
              {user.role}
            </span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const matches = (href: string) => pathname === href || pathname.startsWith(href + "/");
            const isActive =
              matches(item.href) &&
              !navItems.some((o) => o.href.length > item.href.length && matches(o.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (pathname !== item.href) {
                    setNavigatingTo(item.href);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("app:route:change", {
                          detail: { href: item.href, name: item.name },
                        })
                      );
                    }
                  }
                  if (onClose) onClose();
                }}
                className={`group relative flex items-center gap-3 pl-2.5 pr-3 py-2 rounded-xl text-[13.5px] leading-snug transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-brand-500/25 to-brand-500/5 text-white font-semibold ring-1 ring-brand-500/30"
                    : "text-slate-300 font-medium hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-400" />
                )}
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-brand-500 text-slate-950 shadow-md shadow-brand-500/30"
                      : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-brand-300"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="truncate">{item.name}</span>
                {navigatingTo === item.href ? (
                  <span className="ml-auto shrink-0 flex items-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-300" />
                  </span>
                ) : (
                  item.href === "/chat" && chatMessageCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-slate-950 shadow-xs shrink-0">
                      {chatMessageCount > 99 ? "99+" : chatMessageCount}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <Link
              href={isTeamLead ? "/lead/profile" : isSuperAdmin ? "/admin/settings" : "/employee/profile"}
              className="flex items-center gap-3 flex-1 min-w-0 group"
              title="View & Edit My Profile"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-white/20 group-hover:ring-brand-400 transition">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate group-hover:text-brand-300 transition">{user.name}</p>
                <p className="text-[11px] text-brand-300 truncate">{roleLabel}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg transition"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
