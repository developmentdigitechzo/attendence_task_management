import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

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

  return <DashboardShell user={safeUser}>{children}</DashboardShell>;
}
