export const roles = ["ADMIN", "FACULTY", "STUDENT"] as const;

export type AppRole = (typeof roles)[number] | "SUPER_ADMIN";

export const roleHome: Record<AppRole, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  FACULTY: "/faculty/dashboard",
  STUDENT: "/student/dashboard",
};

export const protectedPrefixes: Array<{
  prefix: string;
  allowed: AppRole[];
}> = [
  { prefix: "/admin", allowed: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/faculty", allowed: ["FACULTY"] },
  { prefix: "/student", allowed: ["STUDENT"] },
];

export function isAppRole(value: unknown): value is AppRole {
  return (
    value === "SUPER_ADMIN" ||
    value === "ADMIN" ||
    value === "FACULTY" ||
    value === "STUDENT"
  );
}

export function getRoleHome(role?: string | null) {
  return isAppRole(role) ? roleHome[role] : "/login";
}
