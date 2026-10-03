import { getCurrentUser } from "@/lib/auth";
import ProjectsView from "@/components/projects/ProjectsView";

export default async function LeadProjectsPage() {
  const user = await getCurrentUser();
  return <ProjectsView userRole={user?.role || "MANAGER"} />;
}
