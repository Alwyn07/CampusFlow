import { RoleGuard } from "@/components/auth/role-guard";

export default function FacultyDashboardPage() {
  return (
    <RoleGuard allowed={["FACULTY"]}>
      <main className="min-h-screen bg-slate-50 p-8 text-slate-950">
        <h1 className="text-3xl font-semibold">Faculty Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Protected faculty area for duty schedules, marks entry, and evaluations.
        </p>
      </main>
    </RoleGuard>
  );
}
