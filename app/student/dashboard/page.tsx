import { RoleGuard } from "@/components/auth/role-guard";

export default function StudentDashboardPage() {
  return (
    <RoleGuard allowed={["STUDENT"]}>
      <main className="min-h-screen bg-slate-50 p-8 text-slate-950">
        <h1 className="text-3xl font-semibold">Student Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Protected student area for timetable, attendance, and published results.
        </p>
      </main>
    </RoleGuard>
  );
}
