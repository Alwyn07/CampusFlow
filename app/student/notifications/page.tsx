import { getCurrentStudent, getStudentNotifications } from "@/lib/student-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentNotificationsPage() {
  const student = await getCurrentStudent();
  const notifications = await getStudentNotifications(student.userId);

  await prisma.notification.updateMany({
    where: { userId: student.userId, readAt: null },
    data: { status: "READ", readAt: new Date() },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Notifications</p>
      <h1 className="mt-2 text-3xl font-semibold">Messages and alerts</h1>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{notification.title}</p>
                <span className="text-xs font-medium text-slate-500">{notification.type}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
              <p className="mt-2 text-xs text-slate-400">{notification.createdAt.toLocaleString()}</p>
            </div>
          ))}
          {notifications.length === 0 ? <p className="p-5 text-sm text-slate-500">No notifications yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
