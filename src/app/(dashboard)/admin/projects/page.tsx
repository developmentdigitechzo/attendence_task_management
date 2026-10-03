import { getCurrentUser } from "@/lib/auth";
import ProjectsView from "@/components/projects/ProjectsView";

export default async function AdminProjectsPage() {
  const user = await getCurrentUser();
  return <ProjectsView userRole={user?.role || "SUPER_ADMIN"} />;
}
