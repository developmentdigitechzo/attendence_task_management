import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation || undefined,
    avatarUrl: user.avatarUrl || undefined,
    employeeId: user.employeeId,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar user={safeUser} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={{ id: safeUser.id, name: safeUser.name, role: safeUser.role }} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 bg-[radial-gradient(60rem_24rem_at_100%_-10%,rgba(92,181,40,0.07),transparent)]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
