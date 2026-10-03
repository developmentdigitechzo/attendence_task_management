import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function LeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "EMPLOYEE") {
    redirect("/employee");
  }

  return <>{children}</>;
}
