"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  avatarUrl?: string;
  employeeId: string;
}

export default function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 font-sans">
      <Sidebar user={user} open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          user={{ id: user.id, name: user.name, role: user.role }}
          onMenuClick={() => setNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8 bg-slate-50 bg-[radial-gradient(60rem_24rem_at_100%_-10%,rgba(92,181,40,0.07),transparent)]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}