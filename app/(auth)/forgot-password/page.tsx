import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Recover access without weakening account security."
      description="Reset links are time-limited and stored as bcrypt hashes so raw tokens never sit in the database."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
