import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Secure access"
      title="Run every examination workflow from one controlled desk."
      description="Sign in as an administrator, faculty member, or student to reach the right portal with protected role-based access."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
