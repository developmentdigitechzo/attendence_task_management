import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardRootPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/logout?redirect=/login");
  }

  if (user.role === "SUPER_ADMIN") {
    redirect("/admin");
  } else if (user.role === "MANAGER") {
    redirect("/lead");
  } else {
    redirect("/employee");
  }
}
