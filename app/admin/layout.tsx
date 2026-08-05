import { RoleGuard } from "@/components/auth/role-guard";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["SUPER_ADMIN", "ADMIN"]}>
      <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </RoleGuard>
  );
}
