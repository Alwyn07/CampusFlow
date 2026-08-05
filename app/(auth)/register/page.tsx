import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Account setup"
      title="Create role-based access for CampusFlow."
      description="Start with a secure account. Role profiles can be completed later with department, class, faculty, or student details."
    >
      <RegisterForm />
    </AuthShell>
  );
}
