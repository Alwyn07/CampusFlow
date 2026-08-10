import { StatCard } from "@/components/admin/stat-card";
import {
  getCurrentStudent,
  getStudentMarks,
  getStudentNotifications,
  getStudentTimetable,
  summarizeGpa,
} from "@/lib/student-data";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  const [timetable, marks, notifications] = await Promise.all([
    getStudentTimetable(student.id, student.classId),
    getStudentMarks(student.id),
    getStudentNotifications(student.userId),
  ]);
  const gpa = summarizeGpa(marks);
  const attendanceCount = timetable.filter((item) => item.attendance.length > 0).length;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Student Dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold">Welcome, {student.user.name}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {student.class.code} · Roll No. {student.rollNumber} · {student.class.department.name}
      </p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Upcoming exams" value={timetable.length} detail="Timetable entries" />
        <StatCard label="Attendance" value={attendanceCount} detail="Marked sessions" />
        <StatCard label="Results" value={gpa.semesters.length} detail="Published/verified exams" />
        <StatCard label="CGPA" value={gpa.cgpa} detail="Credit weighted" />
        <StatCard label="Notifications" value={notifications.length} detail="Latest messages" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Next timetable entries</h2>
          <div className="mt-4 space-y-3">
            {timetable.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">{entry.exam.title} · {entry.subject.code}</p>
                <p className="text-slate-600">{entry.startsAt.toLocaleString()} · {entry.roomAllocations.map((room) => room.room.code).join(", ") || "Hall pending"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Recent notifications</h2>
          <div className="mt-4 space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">{notification.title}</p>
                <p className="text-slate-600">{notification.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
