import { RoleGuard } from "@/components/auth/role-guard";
import { FacultySidebar } from "@/components/faculty/sidebar";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["FACULTY"]}>
      <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
        <FacultySidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </RoleGuard>
  );
}
