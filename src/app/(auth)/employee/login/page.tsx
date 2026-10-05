import RoleLoginForm from "@/components/auth/RoleLoginForm";

export const metadata = {
  title: "Employee Portal Login | Digitechzo WorkOS",
  description: "Sign in to the Digitechzo Employee Workspace Portal",
};

export default function EmployeeLoginPage() {
  return <RoleLoginForm portal="employee" />;
}
