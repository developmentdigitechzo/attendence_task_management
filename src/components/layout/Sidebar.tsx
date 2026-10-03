"use client";

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
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isTeamLead = user.role === "MANAGER";

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
  ];

  const employeeNav = [
    { name: "Dashboard (My Day)", href: "/employee", icon: LayoutDashboard },
    { name: "My Attendance", href: "/employee/attendance", icon: Clock },
    { name: "My Tasks", href: "/employee/tasks", icon: CheckSquare },
    { name: "Projects & Milestones", href: "/employee/projects", icon: FolderGit2 },
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
      router.push("/login");
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
    <aside className="w-72 relative bg-slate-950 text-slate-100 flex flex-col shrink-0 select-none min-h-screen border-r border-white/5 bg-[radial-gradient(28rem_18rem_at_0%_0%,rgba(92,181,40,0.14),transparent_70%)]">
      {/* Brand Header */}
      <div className="px-5 py-5 flex items-center gap-3.5 border-b border-white/10">
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
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Footer */}
      <div className="p-4 border-t border-white/10 bg-black/30">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-white/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-brand-300 truncate">{roleLabel}</p>
          </div>
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
  );
}
