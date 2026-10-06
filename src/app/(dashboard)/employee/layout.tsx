import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/logout?redirect=/employee/login");
  }

  return <>{children}</>;
}
