import RoleLoginForm from "@/components/auth/RoleLoginForm";

export const metadata = {
  title: "Admin Portal Login | Digitechzo WorkOS",
  description: "Sign in to the Digitechzo Administrator Portal",
};

export default function AdminLoginPage() {
  return <RoleLoginForm portal="admin" />;
}
