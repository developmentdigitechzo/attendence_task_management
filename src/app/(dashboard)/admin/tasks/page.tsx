import { getCurrentUser } from "@/lib/auth";
import TasksView from "@/components/tasks/TasksView";

export default async function AdminTasksPage() {
  const user = await getCurrentUser();
  return (
    <TasksView
      currentUserId={user?.id || ""}
      userRole={user?.role || "SUPER_ADMIN"}
      defaultFilter="all"
    />
  );
}
