import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import type { AppRole } from "@/lib/roles";
import { getRoleHome } from "@/lib/roles";

type RoleGuardProps = {
  allowed: AppRole[];
  children: React.ReactNode;
};

export async function RoleGuard({ allowed, children }: RoleGuardProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!allowed.includes(session.user.role)) {
    redirect(getRoleHome(session.user.role));
  }

  return <>{children}</>;
}
