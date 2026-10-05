import RoleLoginForm from "@/components/auth/RoleLoginForm";

export const metadata = {
  title: "Team Lead Portal Login | Digitechzo WorkOS",
  description: "Sign in to the Digitechzo Team Lead & Manager Portal",
};

export default function LeadLoginPage() {
  return <RoleLoginForm portal="lead" />;
}
