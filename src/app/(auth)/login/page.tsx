import RoleLoginForm from "@/components/auth/RoleLoginForm";

export const metadata = {
  title: "Sign In | Digitechzo WorkOS",
  description: "Internal Employee Management & Productivity System",
};

export default function GeneralLoginPage() {
  return <RoleLoginForm portal="general" />;
}
