import { RoleGuard } from "@/components/auth/role-guard";
import { StudentSidebar } from "@/components/student/sidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["STUDENT"]}>
      <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
        <StudentSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </RoleGuard>
  );
}
