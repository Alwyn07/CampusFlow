import { BarChart } from "@/components/admin/bar-chart";
import { StatCard } from "@/components/admin/stat-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    departments,
    classes,
    subjects,
    faculty,
    students,
    exams,
    recentStudents,
    departmentRows,
  ] = await Promise.all([
    prisma.department.count(),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.faculty.count(),
    prisma.student.count(),
    prisma.exam.count(),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true, class: true },
    }),
    prisma.department.findMany({
      include: {
        _count: {
          select: { classes: true, subjects: true, faculty: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Examination operations overview
          </h1>
        </div>
        <p className="text-sm text-slate-500">Live academic master data</p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Departments" value={departments} detail="Active academic units" />
        <StatCard label="Classes" value={classes} detail="Configured batches" />
        <StatCard label="Subjects" value={subjects} detail="Exam-ready papers" />
        <StatCard label="Faculty" value={faculty} detail="Duty allocation pool" />
        <StatCard label="Students" value={students} detail="Registered learners" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <BarChart
          title="Department coverage"
          data={departmentRows.map((department) => ({
            label: department.code,
            value:
              department._count.classes +
              department._count.subjects +
              department._count.faculty,
          }))}
        />
        <BarChart
          title="System totals"
          data={[
            { label: "Classes", value: classes },
            { label: "Subjects", value: subjects },
            { label: "Faculty", value: faculty },
            { label: "Students", value: students },
            { label: "Exams", value: exams },
          ]}
        />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-950">Recent students</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Roll No.</th>
                <th className="px-5 py-3 font-medium">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-5 py-3 font-medium text-slate-950">{student.user.name}</td>
                  <td className="px-5 py-3 text-slate-600">{student.user.email}</td>
                  <td className="px-5 py-3 text-slate-600">{student.rollNumber}</td>
                  <td className="px-5 py-3 text-slate-600">{student.class.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
