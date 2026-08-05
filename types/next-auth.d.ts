import type { AppRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: AppRole;
      homePath: string;
    };
  }

  interface User {
    role?: AppRole;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    rememberMe?: boolean;
    sessionExpiresAt?: number;
  }
}
