import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Set a new password for your CampusFlow account."
      description="Use the secure reset link generated from the forgot-password flow."
    >
      <ResetPasswordForm token={params.token ?? ""} />
    </AuthShell>
  );
}
