"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const pathname = usePathname();
  const [loadingModule, setLoadingModule] = useState<{ href: string; name?: string } | null>(null);

  useEffect(() => {
    const handleRouteChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLoadingModule(detail);
    };
    window.addEventListener("app:route:change", handleRouteChange);
    return () => window.removeEventListener("app:route:change", handleRouteChange);
  }, []);

  // Whenever pathname changes, clear loading state smoothly
  useEffect(() => {
    setLoadingModule(null);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 font-sans relative">
      {/* Top glowing progress line during module transition */}
      {loadingModule && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-emerald-400 to-brand-500 z-50 animate-pulse shadow-[0_0_12px_rgba(92,181,40,0.85)]" />
      )}

      <Sidebar user={user} open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar
          user={{ id: user.id, name: user.name, role: user.role }}
          onMenuClick={() => setNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50 bg-[radial-gradient(60rem_24rem_at_100%_-10%,rgba(92,181,40,0.07),transparent)] relative">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}